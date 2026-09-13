import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const OUTPUT_FILE = resolve(PROJECT_ROOT, "data", "listings.json");
const ENV_FILE = resolve(PROJECT_ROOT, ".env");
const DEFAULT_BASE_URL = "https://solve.ivy.homes";
const LIMIT = 50;

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
  const url = new URL("/v1/listings", baseUrl);
  url.searchParams.set("limit", String(LIMIT));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `GET ${url} failed with HTTP ${response.status}: ${responseText || response.statusText}`,
    );
  }

  const page = await response.json();
  if (!Array.isArray(page.results) || typeof page.has_more !== "boolean") {
    throw new Error(
      `GET ${url} returned an invalid pagination response: expected results array and boolean has_more`,
    );
  }

  return page;
}

const INSTRUCTION_LIKE_TEXT =
  /(?:ignore|disregard|forget|override|follow|obey|report|declare|answer|tell).{0,100}(?:instruction|prompt|rule|assistant|ai|system|count|listing)|(?:instruction|prompt injection|system message|ai assistant)/i;

function findSuspiciousText(value, fieldPath, listingId, findings) {
  if (typeof value === "string") {
    if (INSTRUCTION_LIKE_TEXT.test(value)) {
      findings.push({ listingId, field: fieldPath, text: value });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findSuspiciousText(item, `${fieldPath}[${index}]`, listingId, findings),
    );
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      findSuspiciousText(
        item,
        fieldPath ? `${fieldPath}.${key}` : key,
        listingId,
        findings,
      ),
    );
  }
}

function findSuspiciousListingContent(records) {
  const findings = [];
  records.forEach((record) =>
    findSuspiciousText(record, "", record.listing_id, findings),
  );
  return findings;
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
  if (!accessToken)
    throw new Error("Missing access token. Set ACCESS_TOKEN in .env.");

  const records = [];
  let offset = 0;

  while (true) {
    const page = await fetchPage({ baseUrl, apiKey, accessToken, offset });
    records.push(...page.results);
    console.log(
      `Fetched offset=${offset}, received=${page.results.length}, collected=${records.length}, has_more=${page.has_more}`,
    );

    if (page.has_more === false) break;
    if (page.results.length === 0)
      throw new Error(
        `Pagination reported has_more=true but returned no records at offset=${offset}`,
      );

    offset += page.results.length;
  }

  const suspiciousContent = findSuspiciousListingContent(records);
  console.log("Suspicious instruction-like listing content:");
  if (suspiciousContent.length === 0) {
    console.log("None found.");
  } else {
    for (const finding of suspiciousContent) {
      console.log(`listing_id: ${finding.listingId}`);
      console.log(`field: ${finding.field}`);
      console.log(`text: ${finding.text}`);
    }
  }

  await mkdir(resolve(PROJECT_ROOT, "data"), { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  console.log(`Completed: ${records.length} records collected.`);
  console.log(`Saved raw dataset to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(`Dataset collection failed: ${error.message}`);
  process.exitCode = 1;
});
