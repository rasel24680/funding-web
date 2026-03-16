/**
 * MyPulse Company Lookup Test
 * Run: node test-mypulse-lookup.js
 */

require("dotenv").config();

// ── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = "https://demo-api.mypulse-sandbox.io";
const TOKEN_URL = `${BASE_URL}/authorization/oauth2/v2.0/token`;
const CLIENT_ID = process.env.MYPULSE_CLIENT_ID;
const CLIENT_SECRET = process.env.MYPULSE_CLIENT_SECRET;
const SCOPE = process.env.MYPULSE_SCOPE;
const SUBSCRIPTION_KEY = process.env.MYPULSE_SUBSCRIPTION_KEY;

// ── Test CRN (real UK company) ───────────────────────────────────────────────
const TEST_CRN = "00445790"; // Tesco PLC - real UK company for testing

// ── Step 1: Get OAuth Token ───────────────────────────────────────────────────
async function getToken() {
  console.log("\n═══════════════════════════════════════");
  console.log("STEP 1: Getting OAuth Token");
  console.log("═══════════════════════════════════════");
  console.log(`URL: ${TOKEN_URL}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Scope: ${SCOPE}`);

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: SCOPE,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log(`\n❌ Token FAILED - Status: ${response.status}`);
    console.log(JSON.stringify(data, null, 2));
    throw new Error(
      `Token failed: ${data.error_description || data.error || response.status}`,
    );
  }

  console.log(`\n✅ Token OK - expires in ${data.expires_in}s`);
  return data.access_token;
}

// ── Step 2: Get Company Details ───────────────────────────────────────────────
async function getCompanyDetails(token, crn) {
  const url = `${BASE_URL}/v1/get-company-details/${crn}`;

  console.log("\n═══════════════════════════════════════");
  console.log(`STEP 2: Company Details for CRN: ${crn}`);
  console.log("═══════════════════════════════════════");
  console.log(`URL: ${url}`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  console.log(`\nStatus: ${response.status}`);
  console.log("Response:");
  console.log(JSON.stringify(data, null, 2));

  if (!response.ok) {
    console.log(`\n❌ Company Details FAILED`);
  } else {
    console.log(`\n✅ Company Details OK`);
  }

  return data;
}

// ── Step 3: Get Company Officers/Directors ────────────────────────────────────
async function getCompanyOfficers(token, crn) {
  const url = `${BASE_URL}/v1/get-officers/${crn}?Offset=0&Limit=50`;

  console.log("\n═══════════════════════════════════════");
  console.log(`STEP 3: Officers/Directors for CRN: ${crn}`);
  console.log("═══════════════════════════════════════");
  console.log(`URL: ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  console.log(`\nStatus: ${response.status}`);
  console.log("Response:");
  console.log(JSON.stringify(data, null, 2));

  if (!response.ok) {
    console.log(`\n❌ Officers FAILED`);
  } else {
    console.log(`\n✅ Officers OK`);
  }

  return data;
}

// ── Run All Tests ─────────────────────────────────────────────────────────────
async function runTests() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║   MyPulse Company Lookup Test         ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log(`\nEnvironment: SANDBOX`);
  console.log(`Test CRN: ${TEST_CRN}`);

  // Check env vars
  if (!CLIENT_ID || !CLIENT_SECRET || !SCOPE || !SUBSCRIPTION_KEY) {
    console.log("\n❌ Missing env vars:");
    console.log(`  CLIENT_ID: ${CLIENT_ID ? "✅" : "❌ MISSING"}`);
    console.log(`  CLIENT_SECRET: ${CLIENT_SECRET ? "✅" : "❌ MISSING"}`);
    console.log(`  SCOPE: ${SCOPE ? "✅" : "❌ MISSING"}`);
    console.log(
      `  SUBSCRIPTION_KEY: ${SUBSCRIPTION_KEY ? "✅" : "❌ MISSING"}`,
    );
    process.exit(1);
  }

  try {
    const token = await getToken();
    await getCompanyDetails(token, TEST_CRN);
    await getCompanyOfficers(token, TEST_CRN);
  } catch (err) {
    console.log(`\n💥 Test failed: ${err.message}`);
  }

  console.log("\n═══════════════════════════════════════");
  console.log("Test complete");
  console.log("═══════════════════════════════════════\n");
  process.exit(0);
}

runTests();
