import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(PROJECT_ROOT, ".env");
const DATA_DIRECTORY = resolve(PROJECT_ROOT, "data");
const ALL_RENTALS_FILE = resolve(DATA_DIRECTORY, "rentals.json");
const ANNA_NAGAR_FILE = resolve(DATA_DIRECTORY, "anna-nagar-rentals.json");
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
  const url = new URL("/v1/rentals", baseUrl);
  url.searchParams.set("limit", String(LIMIT));
  url.searchParams.set("offset", String(offset));

  const headers = { "x-api-key": apiKey };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(url, { headers });
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

  return page;
}

function hasMoreRecords(page, offset, collectedCount) {
  if (typeof page.has_more === "boolean") return page.has_more;

  if (typeof page.total === "number" && typeof page.page_size === "number") {
    return collectedCount < page.total;
  }

  throw new Error(
    "Unable to determine rental pagination: expected has_more or total/page_size.",
  );
}

const INSTRUCTION_LIKE_TEXT =
  /(?:ignore|disregard|forget|override|follow|obey|report|declare|answer|tell).{0,100}(?:instruction|prompt|rule|assistant|ai|system|count|rental|rent|price)|(?:instruction|prompt injection|system message|ai assistant)/i;

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

function findSuspiciousRentalContent(rentals) {
  const findings = [];
  rentals.forEach((rental) =>
    findSuspiciousText(rental, "", rental.listing_id, findings),
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

  if (!apiKey) {
    throw new Error("Missing API key. Set VITE_API_KEY in .env.");
  }
  if (!accessToken) {
    throw new Error(
      "Missing access token. Set ACCESS_TOKEN in .env or the environment.",
    );
  }

  const rentals = [];
  let offset = 0;
  let pageNumber = 1;

  while (true) {
    const page = await fetchPage({
      baseUrl,
      apiKey,
      accessToken,
      offset,
    });
    rentals.push(...page.results);

    const moreRecords = hasMoreRecords(page, offset, rentals.length);
    console.log(
      `Page ${pageNumber}: received ${page.results.length} records; has_more=${moreRecords}`,
    );

    if (!moreRecords) break;
    if (page.results.length === 0) {
      throw new Error(
        "Pagination indicated more records but returned an empty page.",
      );
    }

    offset += page.results.length;
    pageNumber += 1;
  }

  const annaNagarRentals = rentals.filter(
    (rental) =>
      typeof rental.locality === "string" &&
      rental.locality.toLowerCase() === "anna nagar",
  );
  const totalMonthlyRent = annaNagarRentals.reduce(
    (total, rental) => total + rental.price,
    0,
  );
  const suspiciousContent = findSuspiciousRentalContent(rentals);

  await mkdir(DATA_DIRECTORY, { recursive: true });
  await writeFile(ALL_RENTALS_FILE, `${JSON.stringify(rentals, null, 2)}\n`);
  await writeFile(
    ANNA_NAGAR_FILE,
    `${JSON.stringify(annaNagarRentals, null, 2)}\n`,
  );

  console.log(`Total rental records downloaded: ${rentals.length}`);
  console.log(
    `Number of Anna Nagar rental records: ${annaNagarRentals.length}`,
  );
  console.log(`Total monthly rent for Anna Nagar: ${totalMonthlyRent}`);
  console.log(`Saved complete dataset to ${ALL_RENTALS_FILE}`);
  console.log(`Saved Anna Nagar dataset to ${ANNA_NAGAR_FILE}`);
  console.log("Suspicious instruction-like rental content:");
  if (suspiciousContent.length === 0) {
    console.log("None found.");
  } else {
    for (const finding of suspiciousContent) {
      console.log(`listing_id: ${finding.listingId}`);
      console.log(`field: ${finding.field}`);
      console.log(`text: ${finding.text}`);
    }
  }
}

main().catch((error) => {
  console.error(`Rental download failed: ${error.message}`);
  process.exitCode = 1;
});
