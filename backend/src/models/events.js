const admin = require('firebase-admin');
const db = admin.firestore();

class Event {
  static async getAll(showAll = false, limit = 6, lastDocId = null) {
    const coll = db.collection("events");
    const now = new Date();
    const pageSize = Number(limit) || 6;

    if (showAll) {
      let query = coll.orderBy("date", "desc");
      if (lastDocId) {
        const lastDoc = await coll.doc(lastDocId).get();
        if (lastDoc.exists) query = query.startAfter(lastDoc);
      }
      const snapshot = await query.limit(pageSize).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    // Public: inequality + orderBy on same field only needs the default index (no composite).
    // Filter isActive in memory so we don't need isActive + date composite on new Firebase projects.
    const fetchCap = Math.min(120, Math.max(pageSize * 20, pageSize));
    let query = coll.where("date", ">=", now).orderBy("date", "asc");
    if (lastDocId) {
      const lastDoc = await coll.doc(lastDocId).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    }
    const snapshot = await query.limit(fetchCap).get();
    const rows = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((e) => e.isActive !== false);

    return rows.slice(0, pageSize);
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