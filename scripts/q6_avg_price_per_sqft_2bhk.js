import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const LISTINGS_FILE = resolve(PROJECT_ROOT, "data", "listings.json");
const Q4_RESULTS_FILE = resolve(PROJECT_ROOT, "data", "q4-results.json");
const Q9_RESULTS_FILE = resolve(PROJECT_ROOT, "data", "q9-results.json");
const RESULTS_FILE = resolve(PROJECT_ROOT, "data", "q6-results.json");

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function toRatio(price, carpetArea) {
  if (
    !isFiniteNumber(price) ||
    !isFiniteNumber(carpetArea) ||
    carpetArea <= 0
  ) {
    return null;
  }
  return price / carpetArea;
}

async function main() {
  const listings = JSON.parse(await readFile(LISTINGS_FILE, "utf8"));
  const q4Result = JSON.parse(await readFile(Q4_RESULTS_FILE, "utf8"));
  const q9Result = JSON.parse(await readFile(Q9_RESULTS_FILE, "utf8"));

  const q4ExcludedIds = new Set(
    Array.isArray(q4Result.potentially_impossible_listing_ids)
      ? q4Result.potentially_impossible_listing_ids
      : [],
  );
  const q9ExcludedIds = new Set(
    Array.isArray(q9Result.fake_listing_ids) ? q9Result.fake_listing_ids : [],
  );

  const totalListings = listings.length;
  const isLiveTrueListings = listings.filter(
    (listing) => listing.is_live === true,
  );
  const bedroom2Listings = listings.filter((listing) => listing.bedroom === 2);
  const liveBedroom2Listings = listings.filter(
    (listing) => listing.is_live === true && listing.bedroom === 2,
  );

  const excludedByQ4 = liveBedroom2Listings.filter((listing) =>
    q4ExcludedIds.has(listing.listing_id),
  );
  const excludedByQ9 = liveBedroom2Listings.filter((listing) =>
    q9ExcludedIds.has(listing.listing_id),
  );

  const excludedSet = new Set([
    ...excludedByQ4.map((listing) => listing.listing_id),
    ...excludedByQ9.map((listing) => listing.listing_id),
  ]);

  const baseEligible = liveBedroom2Listings.filter(
    (listing) => !excludedSet.has(listing.listing_id),
  );

  const invalidPriceRecords = baseEligible.filter(
    (listing) => !isFiniteNumber(listing.price),
  );
  const invalidCarpetAreaRecords = baseEligible.filter(
    (listing) =>
      !isFiniteNumber(listing.carpet_area) || listing.carpet_area <= 0,
  );

  const eligibleRecords = baseEligible.filter(
    (listing) =>
      isFiniteNumber(listing.price) &&
      isFiniteNumber(listing.carpet_area) &&
      listing.carpet_area > 0,
  );

  const ratios = eligibleRecords.map((listing) => ({
    listing_id: listing.listing_id,
    price: listing.price,
    carpet_area: listing.carpet_area,
    ratio: toRatio(listing.price, listing.carpet_area),
  }));

  const sumOfRatios = ratios.reduce((total, record) => total + record.ratio, 0);
  const eligibleListingCount = ratios.length;
  const avgPricePerSqft =
    eligibleListingCount === 0 ? 0 : sumOfRatios / eligibleListingCount;
  const avgPricePerSqftRounded = Number(avgPricePerSqft.toFixed(2));

  let independentSum = 0;
  for (const record of ratios) {
    independentSum += record.ratio;
  }
  const independentMean =
    eligibleListingCount === 0 ? 0 : independentSum / eligibleListingCount;
  const independentMeanRounded = Number(independentMean.toFixed(2));

  if (Math.abs(avgPricePerSqft - independentMean) > 1e-12) {
    throw new Error(
      `Independent verification failed: ${avgPricePerSqft} !== ${independentMean}`,
    );
  }

  if (avgPricePerSqftRounded !== independentMeanRounded) {
    throw new Error(
      `Rounded mean mismatch: ${avgPricePerSqftRounded} !== ${independentMeanRounded}`,
    );
  }

  const invalidCount = new Set([
    ...invalidPriceRecords.map((listing) => listing.listing_id),
    ...invalidCarpetAreaRecords.map((listing) => listing.listing_id),
  ]).size;

  const result = {
    avg_price_per_sqft_2bhk: avgPricePerSqftRounded,
    eligible_listing_count: eligibleListingCount,
    excluded_q4_count: excludedByQ4.length,
    excluded_q9_count: excludedByQ9.length,
    invalid_count: invalidCount,
  };

  await writeFile(RESULTS_FILE, `${JSON.stringify(result, null, 2)}\n`);

  console.log(`total listings in listings.json: ${totalListings}`);
  console.log(`total is_live=true listings: ${isLiveTrueListings.length}`);
  console.log(`total bedroom=2 listings: ${bedroom2Listings.length}`);
  console.log(
    `number satisfying both is_live=true and bedroom=2: ${liveBedroom2Listings.length}`,
  );
  console.log(`number excluded by Q4: ${excludedByQ4.length}`);
  console.log(`number excluded by Q9: ${excludedByQ9.length}`);
  console.log(`final eligible listing count: ${eligibleListingCount}`);
  console.log(
    `number of eligible records with invalid/missing price: ${invalidPriceRecords.length}`,
  );
  console.log(
    `number of eligible records with invalid/missing carpet_area: ${invalidCarpetAreaRecords.length}`,
  );

  console.log("Sample ratio calculations:");
  for (const record of ratios.slice(0, 10)) {
    console.log(
      `${record.listing_id}, price=${record.price}, carpet_area=${record.carpet_area}, ratio=${record.ratio}`,
    );
  }

  console.log(
    `sum_of_individual_ratios / eligible_listing_count = ${sumOfRatios} / ${eligibleListingCount} = ${avgPricePerSqft}`,
  );
  console.log(
    `independent verification = ${independentSum} / ${eligibleListingCount} = ${independentMean}`,
  );
  console.log(`avg_price_per_sqft_2bhk = ${avgPricePerSqftRounded}`);
  console.log(`Saved Q6 result to ${RESULTS_FILE}`);
}

main().catch((error) => {
  console.error(`Q6 analysis failed: ${error.message}`);
  process.exitCode = 1;
});
