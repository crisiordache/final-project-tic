const admin = require('firebase-admin');
const db = admin.firestore();

class Event {
  static async getAll() {
    const snapshot = await db.collection('events').where('isActive', '==', true).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = Event;