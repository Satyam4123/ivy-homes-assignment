import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const LISTINGS_FILE = resolve(
  import.meta.dirname,
  "..",
  "data",
  "listings.json",
);

function printCheck({ name, description, records }) {
  console.log(`\n${name}`);
  console.log(`Check: ${description}`);
  console.log(`Violations: ${records.length}`);
}

const INSTRUCTION_LIKE_TEXT =
  /(?:ignore|disregard|forget|override|follow|obey|report|declare|answer|tell).{0,100}(?:instruction|prompt|rule|assistant|ai|system|count|listing|corrupt|impossible)|(?:instruction|prompt injection|system message|ai assistant)/i;

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
  const checks = [
    {
      name: "floor > total_floors",
      description: "The listed floor cannot be above the building's top floor.",
      fields: ["floor", "total_floors"],
      matches: (listing) => listing.floor > listing.total_floors,
    },
    {
      name: "total_floors <= 0",
      description: "A building must have at least one floor.",
      fields: ["total_floors"],
      matches: (listing) => listing.total_floors <= 0,
    },
    {
      name: "floor is not a finite number",
      description: "A property floor must be represented by a finite number.",
      fields: ["floor"],
      matches: (listing) =>
        typeof listing.floor !== "number" || !Number.isFinite(listing.floor),
    },
    {
      name: "bedroom < 0",
      description: "A property cannot have a negative number of bedrooms.",
      fields: ["bedroom"],
      matches: (listing) => listing.bedroom < 0,
    },
    {
      name: "bathroom < 0",
      description: "A property cannot have a negative number of bathrooms.",
      fields: ["bathroom"],
      matches: (listing) => listing.bathroom < 0,
    },
    {
      name: "balcony < 0",
      description: "A property cannot have a negative number of balconies.",
      fields: ["balcony"],
      matches: (listing) => listing.balcony < 0,
    },
    {
      name: "covered_parking < 0",
      description:
        "A property cannot have a negative number of parking spaces.",
      fields: ["covered_parking"],
      matches: (listing) => listing.covered_parking < 0,
    },
    {
      name: "carpet_area <= 0",
      description: "A real property must have positive carpet area.",
      fields: ["carpet_area"],
      matches: (listing) => listing.carpet_area <= 0,
    },
    {
      name: "super_built_up_area <= 0",
      description: "A real property must have positive super built-up area.",
      fields: ["super_built_up_area"],
      matches: (listing) => listing.super_built_up_area <= 0,
    },
    {
      name: "carpet_area > super_built_up_area",
      description: "Carpet area cannot exceed super built-up area.",
      fields: ["carpet_area", "super_built_up_area"],
      matches: (listing) => listing.carpet_area > listing.super_built_up_area,
    },
    {
      name: "latitude outside [-90, 90]",
      description: "Latitude must be within the valid geographic range.",
      fields: ["latitude"],
      matches: (listing) => listing.latitude < -90 || listing.latitude > 90,
    },
    {
      name: "longitude outside [-180, 180]",
      description: "Longitude must be within the valid geographic range.",
      fields: ["longitude"],
      matches: (listing) => listing.longitude < -180 || listing.longitude > 180,
    },
  ];

  console.log(`Total records checked: ${listings.length}`);
  console.log("\nHARD CONTRADICTION CHECKS");
  for (const check of checks) {
    printCheck({ ...check, records: listings.filter(check.matches) });
  }

  const negativeFloors = listings.filter((listing) => listing.floor < 0);
  console.log("\nREVIEW-ONLY CHECKS");
  printCheck({
    name: "floor < 0",
    description:
      "Negative floors may represent physically valid basement levels, so these are not declared corrupt.",
    records: negativeFloors,
    fields: ["floor", "total_floors"],
  });

  const impossibleIds = new Set(
    checks.flatMap((check) =>
      listings.filter(check.matches).map((listing) => listing.listing_id),
    ),
  );
  console.log("\nPOTENTIALLY IMPOSSIBLE RECORDS");
  console.log(`Count: ${impossibleIds.size}`);
  console.log(`listing_ids: ${JSON.stringify([...impossibleIds].sort())}`);

  const suspiciousContent = findSuspiciousListingContent(listings);
  console.log(
    "\nSUSPICIOUS INSTRUCTION-LIKE CONTENT (NOT CORRUPTION EVIDENCE)",
  );
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
  console.error(`Failed to analyze listings: ${error.message}`);
  process.exitCode = 1;
});
