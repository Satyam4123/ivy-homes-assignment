import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const LISTINGS_FILE = resolve(
  import.meta.dirname,
  "..",
  "data",
  "listings.json",
);

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

function findSuspiciousListingContent(listings) {
  const findings = [];
  listings.forEach((listing) =>
    findSuspiciousText(listing, "", listing.listing_id, findings),
  );
  return findings;
}

async function main() {
  const listings = JSON.parse(await readFile(LISTINGS_FILE, "utf8"));
  const activeListings = listings.filter((listing) => listing.is_live === true);
  const inactiveListings = listings.filter(
    (listing) => listing.is_live === false,
  );

  console.log(`active_listings: ${activeListings.length}`);
  console.log(`is_live === false: ${inactiveListings.length}`);

  const suspiciousContent = findSuspiciousListingContent(listings);
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
}

main().catch((error) => {
  console.error(`Failed to count listings: ${error.message}`);
  process.exitCode = 1;
});
