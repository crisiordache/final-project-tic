/**
npm run firebase:verify
Checks backend/.env FIREBASE_PROJECT_ID matches the service account JSON (path from FIREBASE_SERVICE_ACCOUNT_PATH or default serviceAccountKey.json).
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const fs = require("fs");
const { getServiceAccountPath, loadServiceAccount } = require("../loadServiceAccount");

const envProject = process.env.FIREBASE_PROJECT_ID;
const keyPath = getServiceAccountPath();

console.log(
  "FIREBASE_SERVICE_ACCOUNT_PATH:",
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "(not set — using serviceAccountKey.json)"
);

if (!fs.existsSync(keyPath)) {
  console.error("\nFAIL: Service account file not found:\n ", keyPath);
  console.error(
    "\n1. Firebase Console → project **bilete-app** → Project settings → Service accounts → Generate new private key.\n" +
      "2. Save the download as the file name above (in your **backend** folder), or change FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env to match the file you saved.\n" +
      "3. Run npm run firebase:verify again.\n"
  );
  process.exit(1);
}

const sa = loadServiceAccount();
const keyProject = sa.project_id;

console.log("Using service account file:", keyPath);
console.log("backend/.env FIREBASE_PROJECT_ID:", envProject || "(not set)");
console.log("JSON project_id:", keyProject);

if (!envProject) {
  console.error("FAIL: Add FIREBASE_PROJECT_ID to backend/.env");
  process.exit(1);
}

if (envProject !== keyProject) {
  console.error(
    "\nFAIL: Project mismatch.\n" +
      `  .env expects: ${envProject}\n` +
      `  JSON is for:  ${keyProject}\n\n` +
      "Fix: use the service account JSON from the SAME project as FIREBASE_PROJECT_ID.\n" +
      "Either replace the file at the path above, or set FIREBASE_SERVICE_ACCOUNT_PATH to the correct JSON.\n"
  );
  process.exit(1);
}

console.log("\nOK: Service account matches backend/.env project.");
console.log("frontend/.env VITE_FIREBASE_PROJECT_ID should be", JSON.stringify(envProject));
