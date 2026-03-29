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
  // 1) Try base64-encoded JSON from env (for cloud deploys like Render)
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.trim()) {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  }

  // 2) Fall back to local JSON file (for local dev)
  const keyPath = getServiceAccountPath();
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `Service account JSON not found: ${keyPath}\n` +
        "Set FIREBASE_SERVICE_ACCOUNT_BASE64 env var (base64-encoded JSON) " +
        "or FIREBASE_SERVICE_ACCOUNT_PATH, or add serviceAccountKey.json."
    );
  }
  return JSON.parse(fs.readFileSync(keyPath, "utf8"));
}

module.exports = { getServiceAccountPath, loadServiceAccount };
