const admin = require("../firebaseAdmin");
const db = admin.firestore();

class Venue {
  static async getAll() {
    const snapshot = await db.collection("venues").orderBy("name", "asc").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async getById(id) {
    const doc = await db.collection("venues").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }
}

module.exports = Venue;
