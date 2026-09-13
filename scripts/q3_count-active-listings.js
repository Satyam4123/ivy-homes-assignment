import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const LISTINGS_FILE = resolve(import.meta.dirname, "..", "listings.json");

async function main() {
  const listings = JSON.parse(await readFile(LISTINGS_FILE, "utf8"));
  const activeListings = listings.filter((listing) => listing.is_live === true);
  const inactiveListings = listings.filter(
    (listing) => listing.is_live === false,
  );

  console.log(`active_listings: ${activeListings.length}`);
  console.log(`is_live === false: ${inactiveListings.length}`);
}

main().catch((error) => {
  console.error(`Failed to count listings: ${error.message}`);
  process.exitCode = 1;
});
