import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const PROJECTS_FILE = resolve(PROJECT_ROOT, "data", "projects.json");
const LISTINGS_FILE = resolve(PROJECT_ROOT, "data", "listings.json");
const RESULTS_FILE = resolve(PROJECT_ROOT, "data", "q10-results.json");

const INSTRUCTION_LIKE_TEXT =
  /(?:ignore|disregard|forget|override|follow|obey|report|declare|answer|tell).{0,100}(?:instruction|prompt|rule|assistant|ai|system|count|listing)|(?:instruction|prompt injection|system message|ai assistant)/i;

function findSuspiciousText(value, fieldPath, recordId, idField, findings) {
  if (typeof value === "string") {
    if (INSTRUCTION_LIKE_TEXT.test(value)) {
      findings.push({
        [idField]: recordId ?? null,
        field: fieldPath,
        text: value,
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findSuspiciousText(
        item,
        `${fieldPath}[${index}]`,
        recordId,
        idField,
        findings,
      ),
    );
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      findSuspiciousText(
        item,
        fieldPath ? `${fieldPath}.${key}` : key,
        recordId,
        idField,
        findings,
      ),
    );
  }
}

function addFinding(findings, type, details) {
  findings.push({ type, ...details });
}

async function main() {
  const projects = JSON.parse(await readFile(PROJECTS_FILE, "utf8"));
  const listings = JSON.parse(await readFile(LISTINGS_FILE, "utf8"));
  const dataIntegrityFindings = [];
  const suspiciousContent = [];

  const projectIds = new Set();
  const projectIdTypes = new Set();
  projects.forEach((project, index) => {
    if (!project || typeof project !== "object" || Array.isArray(project)) {
      addFinding(dataIntegrityFindings, "invalid_project_record", { index });
      return;
    }

    const projectId = project.project_id;
    projectIdTypes.add(typeof projectId);
    if (projectId === null || projectId === undefined || projectId === "") {
      addFinding(dataIntegrityFindings, "missing_project_id", {
        project_index: index,
      });
    } else if (projectIds.has(projectId)) {
      addFinding(dataIntegrityFindings, "duplicate_project_id", {
        project_id: projectId,
      });
    } else {
      projectIds.add(projectId);
    }

    const reportedCount = project.total_listings;
    if (reportedCount === null || reportedCount === undefined) {
      addFinding(dataIntegrityFindings, "missing_listing_count", {
        project_id: projectId ?? null,
        field: "total_listings",
      });
    } else if (
      typeof reportedCount !== "number" ||
      !Number.isFinite(reportedCount)
    ) {
      addFinding(
        dataIntegrityFindings,
        "unusual_listing_count_type_or_format",
        {
          project_id: projectId ?? null,
          field: "total_listings",
          value: reportedCount,
          value_type: typeof reportedCount,
        },
      );
    } else if (!Number.isInteger(reportedCount) || reportedCount < 0) {
      addFinding(dataIntegrityFindings, "unusual_listing_count_value", {
        project_id: projectId ?? null,
        field: "total_listings",
        value: reportedCount,
      });
    }

    findSuspiciousText(project, "", projectId, "project_id", suspiciousContent);
  });

  const listingCounts = new Map();
  const listingProjectIdTypes = new Set();
  listings.forEach((listing, index) => {
    if (!listing || typeof listing !== "object" || Array.isArray(listing)) {
      addFinding(dataIntegrityFindings, "invalid_listing_record", { index });
      return;
    }

    const projectId = listing.project_id;
    listingProjectIdTypes.add(typeof projectId);
    if (projectId === null || projectId === undefined || projectId === "") {
      addFinding(dataIntegrityFindings, "listing_missing_project_id", {
        listing_id: listing.listing_id ?? null,
        field: "project_id",
      });
    } else {
      listingCounts.set(projectId, (listingCounts.get(projectId) || 0) + 1);
      if (!projectIds.has(projectId)) {
        addFinding(
          dataIntegrityFindings,
          "listing_references_unknown_project",
          {
            listing_id: listing.listing_id ?? null,
            project_id: projectId,
          },
        );
      }
    }

    findSuspiciousText(
      listing,
      "",
      listing.listing_id,
      "listing_id",
      suspiciousContent,
    );
  });

  if (projectIdTypes.size > 1 || listingProjectIdTypes.size > 1) {
    addFinding(dataIntegrityFindings, "inconsistent_project_id_types", {
      project_id_types_in_projects: [...projectIdTypes].sort(),
      project_id_types_in_listings: [...listingProjectIdTypes].sort(),
    });
  }

  const mismatches = [];
  let matchingProjects = 0;
  let zeroActualListings = 0;
  projects.forEach((project) => {
    if (!project || typeof project !== "object" || Array.isArray(project))
      return;

    const actualCount = listingCounts.get(project.project_id) || 0;
    const reportedCount = project.total_listings;
    if (actualCount === 0) zeroActualListings += 1;
    if (typeof reportedCount !== "number" || !Number.isFinite(reportedCount))
      return;

    if (reportedCount === actualCount) {
      matchingProjects += 1;
    } else {
      mismatches.push({
        project_id: project.project_id,
        reported_listing_count: reportedCount,
        actual_listing_count: actualCount,
        difference: actualCount - reportedCount,
      });
    }
  });

  mismatches.sort((first, second) =>
    String(first.project_id).localeCompare(String(second.project_id)),
  );

  const result = {
    projects_with_wrong_listing_count: mismatches,
    summary: {
      total_projects: projects.length,
      total_listings: listings.length,
      matching_projects: matchingProjects,
      mismatching_projects: mismatches.length,
    },
    data_integrity_findings: [
      ...dataIntegrityFindings,
      { type: "projects_with_zero_actual_listings", count: zeroActualListings },
    ],
    suspicious_content: suspiciousContent,
  };

  await writeFile(RESULTS_FILE, `${JSON.stringify(result, null, 2)}\n`);

  console.log("Projects with mismatching listing counts:");
  for (const mismatch of mismatches) {
    console.log(
      `${mismatch.project_id}: reported=${mismatch.reported_listing_count}, actual=${mismatch.actual_listing_count}`,
    );
  }
  console.log(`total projects: ${result.summary.total_projects}`);
  console.log(`total listings: ${result.summary.total_listings}`);
  console.log(`projects with zero actual listings: ${zeroActualListings}`);
  console.log(`matching projects: ${result.summary.matching_projects}`);
  console.log(`mismatching projects: ${result.summary.mismatching_projects}`);
  console.log(`data integrity findings: ${dataIntegrityFindings.length}`);
  console.log(`suspicious content findings: ${suspiciousContent.length}`);
  console.log(`Saved Q10 result to ${RESULTS_FILE}`);
}

main().catch((error) => {
  console.error(`Q10 analysis failed: ${error.message}`);
  process.exitCode = 1;
});
