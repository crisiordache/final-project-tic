const admin = require("../firebaseAdmin");
const db = admin.firestore();

class User {
  static async create(uid, data) {
    return db.collection('users').doc(uid).set({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  static async getById(uid) {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async getAll() {
    const snapshot = await db.collection('users').get();
    if (snapshot.empty) return [];
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    return users;
  }

  static async grantAdminAccess(uid) {
    await db.collection('users').doc(uid).update( {role: 'admin'} );
  }

  static async revokeAdminAccess(uid) {
    await db.collection('users').doc(uid).update( {role: 'user'} );
  }
}

module.exports = User;
