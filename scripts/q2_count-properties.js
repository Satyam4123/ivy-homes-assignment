import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const LISTINGS_FILE = resolve(import.meta.dirname, "..", "listings.json");
const PROPERTY_FIELDS = [
  "city_id",
  "bedroom",
  "bathroom",
  "floor",
  "total_floors",
  "facing_direction",
  "carpet_area",
  "super_built_up_area",
];

async function main() {
  const listings = JSON.parse(await readFile(LISTINGS_FILE, "utf8"));
  const fingerprints = new Set(
    listings.map((listing) =>
      JSON.stringify(PROPERTY_FIELDS.map((field) => listing[field])),
    ),
  );

  console.log(`Total records: ${listings.length}`);
  console.log(`Distinct properties: ${fingerprints.size}`);
}

main().catch((error) => {
  console.error(`Failed to count properties: ${error.message}`);
  process.exitCode = 1;
});
