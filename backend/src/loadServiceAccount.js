const fs = require("fs");
const path = require("path");

const backendRoot = path.join(__dirname, "..");

function getServiceAccountPath() {
  const custom = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (custom && String(custom).trim()) {
    return path.isAbsolute(custom) ? custom : path.join(backendRoot, custom);
  }
  return path.join(backendRoot, "serviceAccountKey.json");
}

function loadServiceAccount() {
  const keyPath = getServiceAccountPath();
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `Service account JSON not found: ${keyPath}\n` +
        "Set FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env (relative to backend folder) or add serviceAccountKey.json."
    );
  }
  return JSON.parse(fs.readFileSync(keyPath, "utf8"));
}

module.exports = { getServiceAccountPath, loadServiceAccount };
