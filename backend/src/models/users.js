const admin = require("../firebaseAdmin");
const db = admin.firestore();

class User {
  static async create(uid, data) {
    return db.collection(process.env.USERS_COLLECTION).doc(uid).set({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  static async getById(uid) {
    const doc = await db.collection(process.env.USERS_COLLECTION).doc(uid).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }
}

module.exports = User;
