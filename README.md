# Ivy Homes

A React frontend for the Ivy Homes property API, built for the September 2026 software engineering internship assignment. The application supports authenticated browsing of sale listings, rentals, projects, saved listings, and calculated market insights.

## Project Overview

The app uses the running API at `https://solve.ivy.homes` as its source of property data. The frontend is protected by the login flow and includes:

- Paginated sale listings with locality, bedroom, price, furnishing, and sorting controls.
- Sale listing detail pages with saved-listing actions and links to the original listing.
- Rental browsing and rental detail pages with monthly rent formatting.
- Project browsing and project detail pages.
- Per-user saved listings using the running `/v1/saved` API.
- A market insights page calculated from complete listings, rental, and project datasets.

## Tech Stack

- React 19
- Vite 8
- React Router DOM 7
- Tailwind CSS 4 through `@tailwindcss/vite`
- ESLint 10
- Browser `fetch` for API requests

## 1. How To Run It

### Prerequisites

- Node.js with npm.
- An Ivy Homes API key and login credentials.
- Network access to `https://solve.ivy.homes`.

From this directory:

```powershell
npm install
```

Create a local `.env` file with placeholders replaced by your own credentials:

```dotenv
VITE_API_BASE_URL=https://solve.ivy.homes
VITE_API_KEY=your_api_key
ACCESS_TOKEN=your_access_token
```

For the frontend application, only `VITE_API_BASE_URL` and `VITE_API_KEY` are required. The frontend obtains its access and refresh tokens through the normal `/auth/login` flow, so you do not need to provide `ACCESS_TOKEN` to run the frontend. `ACCESS_TOKEN` is additionally required only to run or reproduce the data-analysis scripts used to answer the ten assignment questions.

Never commit `.env` or any file containing an API key, access token, password, or other credential. `.gitignore` already excludes `.env`.

### Frontend commands

Start the Vite development server:

```powershell
npm run dev
```

Run the production build:

```powershell
npm run build
```

Preview the production build locally:

```powershell
npm run preview
```

Run linting:

```powershell
npm run lint
```

### Data-analysis scripts

Run these from `ivy-homes-assignment` after configuring `.env`:

```powershell
node scripts/q1_fetch-listings.mjs
node scripts/q2_count-properties.js
node scripts/q3_count-active-listings.js
node scripts/q4_find-impossible-listings.js
node scripts/q5_download-rentals.js
node scripts/q6_avg_price_per_sqft_2bhk.js
node scripts/q7_costliest-project.js
node scripts/q8_count-recent-listings.js
node scripts/q10_count-project-listing-mismatches.js
```

The API retrieval scripts read the API configuration, retrieve data using the working authentication headers and pagination behavior, and write datasets under `data/`; the other scripts analyze those checked-in datasets and write question-specific results there. The repository contains checked-in result files such as `q4-results.json`, `q6-results.json`, `q8-results.json`, `q9-results.json`, and `q10-results.json`. Q9 was handled differently because identifying potentially fake listings required forming and testing a data-level hypothesis rather than applying a single deterministic calculation. I used Claude during this investigation to help analyze suspicious listing patterns and formulate the hypothesis. I then tested that hypothesis against the complete listings dataset and independently verified the resulting listing IDs before including them in `submission.json`. The resulting analysis is retained in `data/q9-results.json`, with related investigation artifacts in the repository's `evidence/` directory. Therefore, there is no standalone q9 script in `scripts/`; `q9-results.json` contains the final result.

## 2. How I Worked Out Which Documentation To Distrust

I treated the running API as the source of truth. I used Postman extensively during the initial API exploration and verification, testing documented endpoints, authentication behavior, request parameters, filters, sorting, pagination, and response formats directly against the real service.

After identifying areas that appeared inconsistent, I used the investigation scripts in `scripts/` to test those hypotheses across the complete datasets rather than relying only on individual API responses or the first page of results. I compared documented behavior with the behavior actually observed from the API, inspected response shapes and pagination metadata, and retrieved the datasets completely where the question or hypothesis required it.

I recorded only discrepancies that I personally reproduced. The supporting proofs and investigation artifacts are included in the `evidence/` directory and can be inspected alongside the structured findings in `submission.json`.

### A Note On Postman

Postman was the first tool I used to interact with the real API, and probably the most useful part of the early investigation. It was the quickest way to stop guessing: I could try a request from the docs, change a parameter, inspect the headers and response, and see where the API differed from what the documentation promised.

When something looked interesting, I used the Postman result to form a hypothesis and reproduce the behavior. Once I knew what I wanted to test, I moved it into scripts and ran it across the complete dataset rather than checking records one by one. The workflow was essentially: **Postman to explore and reproduce -> scripts to scale -> evidence and `submission.json` to support the final findings.**

The Postman requests and responses, along with the other supporting investigation material, are available in the `evidence/` directory so the investigation can be followed and checked against the final submission.

The reproduced discrepancies were:

- Authentication uses the `x-api-key` header rather than the documented `api_key` query parameter.
- Access tokens expire after 900 seconds and the API provides refresh tokens and a refresh endpoint, contrary to the documented 24-hour, no-refresh flow.
- Logout reports that tokens are stateless and should be discarded client-side rather than invalidating them server-side.
- Listings and rentals use `limit` plus `offset`; the documented `page` parameter is ignored.
- The effective API limit is capped at 50, despite the documented maximum of 200.
- `/v1/listings` reported `total=3867`, while complete pagination retrieved 4,100 records.
- `/v1/listings` returned 867 records with `is_live=false` even though the documentation described the endpoint as active-only.
- Listing descending order did not reverse results as documented, and `posted_at` sorting did not produce monotonic timestamps.
- Locality matching was case-insensitive rather than requiring exact lowercase input.
- `/v1/listings/{listing_id}/similar` returned 404.
- Project `price_min` and `price_max` values were compact decimal values, not integer rupee values as documented.
- The documented `/v1/favourites` operations returned 404. The running API instead exposed working saved-listing operations under `/v1/saved`, which was not documented.
- `/v1/analytics/summary` returned 404.
- Complete listing validation found physically impossible records, including invalid floor and area relationships.

These findings are documented as structured records in `submission.json`, with supporting evidence identifiers where applicable. The corresponding proof files are available in the `evidence/` directory for review.

## 3. What I Checked That Turned Out To Be Fine

The following checks were performed and did not reveal an additional discrepancy:

- The complete listings crawl accepted each page only when it contained an array `results` value and a boolean `has_more` value. Pagination ended when `has_more` became false, and the script rejected an empty page that claimed more records remained.
- The complete projects crawl returned valid `results` arrays and boolean `has_more` metadata on every page. Project price fields were numeric across the dataset; the discrepancy was their unit interpretation, not their basic numeric shape.
- The rental downloader returned valid JSON with a `results` array on every page and could determine continuation from `has_more` or, where needed, `total` plus `page_size`.
- All 4,100 retrieved listings had parseable `posted_at` timestamps. The recent-listing calculation therefore used valid timestamp values rather than silently dropping malformed dates.
- The Q6 price-per-square-foot calculation was independently recomputed from the individual ratios. The independent mean matched the primary mean, and the rounded values matched at two decimal places.
- The project mismatch analysis validated project and listing records, checked project ID types, counted references from listings, and compared those counts consistently against each project's reported `total_listings` field. The resulting mismatch count was reproduced as 336 projects rather than inferred from the API's reported totals.

These checks establish which parts of the observed response structure and local calculations were dependable, even though other documented behaviors were not.

## 4. What I Would Do With Another Two Days

I would focus on improving reliability, testability, and the quality of the existing product rather than adding broad new features:

- Add focused tests for authentication restoration and token refresh, saved-listing persistence and user isolation, listing filters and pagination, and listing/rental/project detail routes.
- Add automated API/data validation checks for response shapes, pagination termination, limit caps, missing fields, invalid prices or areas, and documented-versus-observed behavior.
- Improve edge-case handling for empty results, partial API failures, expired sessions, malformed `listing_url` values, and detail records that cannot be retrieved.
- Run a dedicated accessibility and responsive QA pass across login, navigation, cards, forms, loading/error states, and keyboard interaction, then fix any issues found.
- Improve the Insights data-loading flow with request deduplication or lightweight caching, clearer loading/progress states, and more resilient handling of long-running dataset retrievals.
- Expand the evidence and automated regression checks around the API discrepancies already identified, so future API or documentation changes can be detected reliably without introducing speculative findings.

## API/Data Investigation

The investigation scripts retrieve and save complete datasets for listings, rentals, and projects. They use the observed request format: the API key is sent in `x-api-key`, authenticated requests send a Bearer access token, and collection traversal uses `limit` and `offset` until `has_more` is false. The frontend follows the same API behavior through `src/services/apiClient.js`, `listingsService.js`, `rentalsService.js`, and `projectsService.js`.

The `data/` directory contains downloaded datasets and question-specific result files. The `evidence/` directory contains the supporting investigation artifacts referenced by `submission.json`.

## Deployment And Demo

The submitted repository and demo URLs recorded in `submission.json` are:

- Repository: https://github.com/Satyam4123/ivy-homes-assignment.git
- Demo: https://ivy-homes-assignment-seven.vercel.app/

The Vercel configuration uses an SPA rewrite in `vercel.json` so direct frontend routes can load through `index.html`. Deployment environment variables must be configured in the hosting provider; secrets should not be committed to the repository.

## AI Usage Disclosure

AI tools and development/API tools were used throughout the development and investigation process.

- **ChatGPT:** Used for assignment interpretation, API investigation and reasoning, frontend debugging and review, calculation review, findings review, and implementation planning.
- **Claude:** Assisted specifically with the Q9 fake/suspicious listing investigation by helping analyze patterns and formulate a hypothesis. The hypothesis was then tested against the dataset and the final IDs were independently verified.
- **Copilot:** Used for repository code exploration, implementation, debugging, refactoring, UI fixes, cleanup, and README assistance.
- **Postman:** Used separately as a development/API tool for direct API exploration and reproduction of documented-versus-actual API behavior.

AI-generated suggestions and code were reviewed and tested. API behavior, calculations, evidence, application functionality, and final repository changes were verified against the running API, local data, and the assignment requirements.
