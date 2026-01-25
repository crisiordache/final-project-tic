const admin = require('firebase-admin');
const db = admin.firestore();

class Event {
  static async getAll(showAll = false, limit = 6, lastDocId = null) {
    let query = await db.collection('events');
    const now = new Date();
    if(!showAll) {
      query = query
        .where('isActive', '==', true)
        .where('date', '>=', now);
    }
    query = query.orderBy('date', 'asc');

    if (lastDocId) {
      const lastDoc = await db.collection('events').doc(lastDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.limit(Number(limit)).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getById(eventId) {
    const doc = await db.collection('events').doc(eventId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async create(data) {
    const docRef = await db.collection('events').doc();
    await docRef.set({
      ...data,
      eventId: docRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }

  static async update(eventId, data) {
    await db.collection('events').doc(eventId).update({
      ...data,
    });
  }

  static async softDelete(eventId) {
    await db.collection('events').doc(eventId).update({ isActive: false});
  }

  static async restore(eventId) {
    await db.collection('events').doc(eventId).update({ isActive: true});
  }

  static async hardDelete(eventId) {
    await db.collection('events').doc(eventId).delete();
  }
}

module.exports = Event;