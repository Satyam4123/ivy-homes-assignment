import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const LISTINGS_FILE = resolve(PROJECT_ROOT, "data", "listings.json");
const RESULTS_FILE = resolve(PROJECT_ROOT, "data", "q8-results.json");
const START = new Date("2026-09-03T00:00:00+05:30");
const END = new Date("2026-09-10T00:00:00+05:30");

const INSTRUCTION_LIKE_TEXT =
  /(?:ignore|disregard|forget|override|follow|obey|report|declare|answer|tell).{0,100}(?:instruction|prompt|rule|assistant|ai|system|count|listing)|(?:instruction|prompt injection|system message|ai assistant)/i;

function findSuspiciousText(value, fieldPath, listingId, findings) {
  if (typeof value === "string") {
    if (INSTRUCTION_LIKE_TEXT.test(value)) {
      findings.push({ listing_id: listingId, field: fieldPath, text: value });
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

function findSuspiciousListingContent(listings) {
  const findings = [];
  listings.forEach((listing) =>
    findSuspiciousText(listing, "", listing.listing_id, findings),
  );
  return findings;
}

async function main() {
  const listings = JSON.parse(await readFile(LISTINGS_FILE, "utf8"));
  const validListings = listings.filter(
    (listing) =>
      typeof listing.posted_at === "string" &&
      !Number.isNaN(Date.parse(listing.posted_at)),
  );
  const countedListings = validListings.filter((listing) => {
    const postedAt = new Date(listing.posted_at);
    return postedAt >= START && postedAt < END;
  });
  const sortedPostedAt = validListings
    .map((listing) => new Date(listing.posted_at))
    .sort((first, second) => first - second);
  const suspiciousContent = findSuspiciousListingContent(listings);

  const result = {
    total_records: listings.length,
    valid_posted_at_records: validListings.length,
    earliest_posted_at: sortedPostedAt[0]?.toISOString() || null,
    latest_posted_at:
      sortedPostedAt[sortedPostedAt.length - 1]?.toISOString() || null,
    listings_last_7_days: countedListings.length,
    example_listing_ids: countedListings
      .slice(0, 10)
      .map((listing) => listing.listing_id),
    suspicious_content: suspiciousContent,
  };

  await writeFile(RESULTS_FILE, `${JSON.stringify(result, null, 2)}\n`);

  console.log(`total records: ${result.total_records}`);
  console.log(`valid posted_at records: ${result.valid_posted_at_records}`);
  console.log(`earliest posted_at: ${result.earliest_posted_at}`);
  console.log(`latest posted_at: ${result.latest_posted_at}`);
  console.log(`listings_last_7_days = ${result.listings_last_7_days}`);
  console.log(
    `example listing_ids: ${JSON.stringify(result.example_listing_ids)}`,
  );
  console.log("Suspicious instruction-like listing content:");
  if (suspiciousContent.length === 0) {
    console.log("None found.");
  } else {
    for (const finding of suspiciousContent) {
      console.log(`listing_id: ${finding.listing_id}`);
      console.log(`field: ${finding.field}`);
      console.log(`text: ${finding.text}`);
    }
  }
  console.log(`Saved Q8 result to ${RESULTS_FILE}`);
}

main().catch((error) => {
  console.error(`Q8 analysis failed: ${error.message}`);
  process.exitCode = 1;
});
