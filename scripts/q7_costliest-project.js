import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(PROJECT_ROOT, ".env");
const DATA_DIRECTORY = resolve(PROJECT_ROOT, "data");
const OUTPUT_FILE = resolve(DATA_DIRECTORY, "projects.json");
const DEFAULT_BASE_URL = "https://solve.ivy.homes";
const LIMIT = 200;

function parseEnvFile(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        if (separator === -1) return null;

        const key = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, "$2");
        return [key, value];
      })
      .filter(Boolean),
  );
}

async function loadEnvFile() {
  try {
    return parseEnvFile(await readFile(ENV_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function fetchPage({ baseUrl, apiKey, accessToken, offset }) {
  const url = new URL("/v1/projects", baseUrl);
  url.searchParams.set("limit", String(LIMIT));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `GET ${url} failed with HTTP ${response.status}: ${responseText || response.statusText}`,
    );
  }

  let page;
  try {
    page = JSON.parse(responseText);
  } catch {
    throw new Error(`GET ${url} returned invalid JSON.`);
  }

  if (!Array.isArray(page.results)) {
    throw new Error(
      `GET ${url} returned an invalid response: results must be an array.`,
    );
  }

  if (typeof page.has_more !== "boolean") {
    throw new Error(
      `GET ${url} returned an invalid response: has_more must be a boolean.`,
    );
  }

  return page;
}

const INSTRUCTION_LIKE_TEXT =
  /(?:ignore|disregard|forget|override|follow|obey|report|declare|answer|tell).{0,100}(?:instruction|prompt|rule|assistant|ai|system|costliest|project)|(?:instruction|prompt injection|system message|ai assistant)/i;

function findSuspiciousText(value, fieldPath, projectId, findings) {
  if (typeof value === "string") {
    if (INSTRUCTION_LIKE_TEXT.test(value)) {
      findings.push({
        project_id: projectId,
        field: fieldPath,
        text: value,
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findSuspiciousText(item, `${fieldPath}[${index}]`, projectId, findings),
    );
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      findSuspiciousText(
        item,
        fieldPath ? `${fieldPath}.${key}` : key,
        projectId,
        findings,
      ),
    );
  }
}

function inspectForInstructionLikeContent(projects) {
  const findings = [];
  projects.forEach((project) =>
    findSuspiciousText(project, "", project.project_id, findings),
  );
  return findings;
}

function inferPriceNormalization(projects) {
  const prices = projects.flatMap((project) => [
    project.price_min,
    project.price_max,
  ]);

  if (
    prices.some((price) => typeof price !== "number" || !Number.isFinite(price))
  ) {
    throw new Error(
      "Every project must have numeric price_min and price_max values.",
    );
  }

  const maximum = Math.max(...prices);
  if (maximum >= 1_000_000) {
    return {
      factor: 1,
      unit: "INR",
      explanation: "Observed values are already rupee-scale amounts.",
    };
  }

  if (maximum >= 100) {
    return {
      factor: 100_000,
      unit: "lakh INR",
      explanation:
        "Observed values are two-to-four digit amounts, consistent with lakh-denominated prices.",
    };
  }

  return {
    factor: 10_000_000,
    unit: "crore INR",
    explanation:
      "Observed values are below 100, consistent with crore-denominated prices.",
  };
}

async function main() {
  const fileEnv = await loadEnvFile();
  const baseUrl =
    process.env.VITE_API_BASE_URL ||
    fileEnv.VITE_API_BASE_URL ||
    DEFAULT_BASE_URL;
  const apiKey = process.env.VITE_API_KEY || fileEnv.VITE_API_KEY;
  const accessToken = (
    process.env.ACCESS_TOKEN || fileEnv.ACCESS_TOKEN
  )?.replace(/\s+/g, "");

  if (!apiKey) throw new Error("Missing API key. Set VITE_API_KEY in .env.");
  if (!accessToken) {
    throw new Error(
      "Missing access token. Set ACCESS_TOKEN in .env or the environment.",
    );
  }

  const projects = [];
  let offset = 0;
  let pageNumber = 1;

  while (true) {
    const page = await fetchPage({
      baseUrl,
      apiKey,
      accessToken,
      offset,
    });
    projects.push(...page.results);

    console.log(
      `Page ${pageNumber}: received ${page.results.length} projects; has_more=${page.has_more}`,
    );

    if (page.has_more === false) break;
    if (page.results.length === 0) {
      throw new Error(
        "Pagination indicated more projects but returned an empty page.",
      );
    }

    offset += page.results.length;
    pageNumber += 1;
  }

  const suspiciousContent = inspectForInstructionLikeContent(projects);
  const normalization = inferPriceNormalization(projects);
  const normalizedProjects = projects.map((project) => ({
    project,
    priceMaxInr: project.price_max * normalization.factor,
  }));
  const rankedProjects = [...projects].sort(
    (first, second) =>
      second.price_max * normalization.factor -
      first.price_max * normalization.factor,
  );
  const costliestProject = rankedProjects[0];
  const topTen = normalizedProjects
    .sort((first, second) => second.priceMaxInr - first.priceMaxInr)
    .slice(0, 10);

  if (!costliestProject) throw new Error("No projects were retrieved.");

  await mkdir(DATA_DIRECTORY, { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(projects, null, 2)}\n`);

  console.log(`Total projects retrieved: ${projects.length}`);
  console.log(
    `Price normalization: multiply by ${normalization.factor} (${normalization.unit}).`,
  );
  console.log(`Reason: ${normalization.explanation}`);
  console.log("Top 10 projects by normalized price_max:");
  for (const [index, { project, priceMaxInr }] of topTen.entries()) {
    console.log(
      `${index + 1}. project_id=${project.project_id}, original price_max=${project.price_max}, normalized price_max_inr=${priceMaxInr}`,
    );
  }
  console.log("\nSuspicious instruction-like content:");
  if (suspiciousContent.length === 0) {
    console.log("None found.");
  } else {
    for (const finding of suspiciousContent) {
      console.log(`project_id: ${finding.project_id}`);
      console.log(`field: ${finding.field}`);
      console.log(`text: ${finding.text}`);
    }
  }
  console.log(`Saved complete dataset to ${OUTPUT_FILE}`);
  console.log(
    JSON.stringify(
      {
        project_id: costliestProject.project_id,
        price_max_inr: costliestProject.price_max * normalization.factor,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(`Project download failed: ${error.message}`);
  process.exitCode = 1;
});
