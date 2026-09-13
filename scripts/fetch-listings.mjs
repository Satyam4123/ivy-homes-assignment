import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const OUTPUT_FILE = resolve(PROJECT_ROOT, "listings.json");
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

async function main() {
  const fileEnv = await loadEnvFile();
  const baseUrl =
    process.env.IVY_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    fileEnv.VITE_API_BASE_URL ||
    DEFAULT_BASE_URL;
  const apiKey =
    process.env.IVY_API_KEY || process.env.VITE_API_KEY || fileEnv.VITE_API_KEY;
  const accessToken = process.env.IVY_ACCESS_TOKEN || process.env.ACCESS_TOKEN;

  if (!apiKey)
    throw new Error(
      "Missing API key. Set IVY_API_KEY or VITE_API_KEY in .env.",
    );
  if (!accessToken)
    throw new Error(
      "Missing access token. Set IVY_ACCESS_TOKEN or ACCESS_TOKEN in the environment.",
    );

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

  await writeFile(OUTPUT_FILE, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  console.log(`Completed: ${records.length} records collected.`);
  console.log(`Saved raw dataset to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(`Dataset collection failed: ${error.message}`);
  process.exitCode = 1;
});
