const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const admin = require("firebase-admin");
const { loadServiceAccount } = require("./loadServiceAccount");

const serviceAccount = loadServiceAccount();
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
