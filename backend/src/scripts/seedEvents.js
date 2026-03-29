const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const admin = require("firebase-admin");
const { loadServiceAccount } = require("../loadServiceAccount");
const generateEvents = require("./eventGenerator");

const serviceAccount = loadServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(process.env.FIREBASE_DATABASE_URL
      ? { databaseURL: process.env.FIREBASE_DATABASE_URL }
      : {})
  });
}

const db = admin.firestore();
const eventsCollectionName = process.env.EVENTS_COLLECTION || "events";

async function seed() {
  try {
    const events = await generateEvents(10);

    const batch = db.batch();
    const eventsCollection = db.collection(eventsCollectionName);

    events.forEach((event) => {
      const docRef = eventsCollection.doc(event.eventId);
      batch.set(docRef, event);
    });

    await batch.commit();
    console.log(
      `Seeded ${events.length} events into "${eventsCollectionName}" (Firebase project: ${serviceAccount.project_id}).`
    );
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();