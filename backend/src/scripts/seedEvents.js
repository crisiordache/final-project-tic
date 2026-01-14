const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');
const generateEvents = require("./eventGenerator");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

async function seed() {
  try {
    const events = await generateEvents(30);

    const batch = db.batch();
    const eventsCollection = db.collection('events');

    events.forEach((event) => {
      const docRef = eventsCollection.doc(event.eventId);
      batch.set(docRef, event);
    });

    await batch.commit();
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

seed();