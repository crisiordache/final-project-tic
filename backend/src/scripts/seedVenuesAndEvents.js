/**
 * Wipes events, venues, seats, seat_reservations then seeds
 * 18 venues (Bucharest + 8 other Romanian cities) + 50 events + seat docs.
 * Run from backend: npm run db:seed:venues-events
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const admin = require("firebase-admin");
const { loadServiceAccount } = require("../loadServiceAccount");

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
const eventsColl = db.collection(process.env.EVENTS_COLLECTION || "events");

/* ── Helpers ───────────────────────────────────────────────────── */
async function wipeCollection(name) {
  const coll = db.collection(name);
  const snap = await coll.get();
  if (snap.empty) return 0;
  let batch = db.batch();
  let n = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    n++;
    if (n % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  if (n % 400 !== 0) await batch.commit();
  return n;
}

function dayFromNow(minDays, maxDays) {
  const d = new Date();
  const add = minDays + Math.floor(Math.random() * (maxDays - minDays + 1));
  d.setDate(d.getDate() + add);
  d.setHours(0, 0, 0, 0);
  return d;
}

const times = ["18:00", "19:00", "19:30", "20:00", "20:30", "21:00"];

/* ── Venues ────────────────────────────────────────────────────── */
const venueDefs = {
  // Bucharest (10)
  grand:     { name: "Grand Arena Hall",        address: "Bucharest",  rows: 12, seatsPerRow: 15 },
  studio:    { name: "Studio Theatre",          address: "Bucharest",  rows: 10, seatsPerRow: 10 },
  opera:     { name: "National Opera House",    address: "Bucharest",  rows: 14, seatsPerRow: 18 },
  sala:      { name: "Sala Palatului",          address: "Bucharest",  rows: 16, seatsPerRow: 20 },
  arenele:   { name: "Arenele Romane",          address: "Bucharest",  rows: 10, seatsPerRow: 12 },
  control:   { name: "Control Club",            address: "Bucharest",  rows: 6,  seatsPerRow: 8  },
  beraria:   { name: "Berăria H",               address: "Bucharest",  rows: 8,  seatsPerRow: 10 },
  fratelli:  { name: "Fratelli Studios",        address: "Bucharest",  rows: 8,  seatsPerRow: 12 },
  expirat:   { name: "Expirat / Halele Carol",  address: "Bucharest",  rows: 5,  seatsPerRow: 10 },
  national:  { name: "Teatrul Național",        address: "Bucharest",  rows: 12, seatsPerRow: 14 },
  // Cluj-Napoca (2)
  clujForm:  { name: "Form Space",              address: "Cluj-Napoca", rows: 7,  seatsPerRow: 10 },
  clujNat:   { name: "Teatrul Național Cluj",   address: "Cluj-Napoca", rows: 11, seatsPerRow: 14 },
  // Timișoara
  tmCap:     { name: "Capitolium Mall Arena",   address: "Timișoara",   rows: 9,  seatsPerRow: 12 },
  // Iași
  iasiPal:   { name: "Palatul Culturii Iași",   address: "Iași",        rows: 13, seatsPerRow: 16 },
  // Brașov
  bvPat:     { name: "Patria Cinema Hall",      address: "Brașov",      rows: 8,  seatsPerRow: 12 },
  // Constanța
  ctCaz:     { name: "Cazino Constanța",        address: "Constanța",   rows: 10, seatsPerRow: 10 },
  // Sibiu
  sbTeat:    { name: "Teatrul Radu Stanca",     address: "Sibiu",       rows: 10, seatsPerRow: 12 },
  // Craiova
  cvNat:     { name: "Teatrul Național Craiova",address: "Craiova",     rows: 9,  seatsPerRow: 11 }
};
const venueKeys = Object.keys(venueDefs);

/* ── Ticket helpers ────────────────────────────────────────────── */
function seatedTickets(venueKey, vipRows, stdPrice, vipPrice) {
  const v = venueDefs[venueKey];
  const allRows = Array.from({ length: v.rows }, (_, i) => i + 1);
  const standardRows = allRows.filter(r => !vipRows.includes(r));
  return [
    { type: "Standard", price: stdPrice, available: standardRows.length * v.seatsPerRow, rows: standardRows },
    { type: "VIP",      price: vipPrice, available: vipRows.length * v.seatsPerRow,      rows: vipRows }
  ];
}

function gaTickets(stdPrice, vipPrice, stdQty, vipQty) {
  return [
    { type: "Standard", price: stdPrice, available: stdQty, rows: [] },
    { type: "VIP",      price: vipPrice, available: vipQty, rows: [] }
  ];
}

/* ── Seat initialisation ──────────────────────────────────────── */
const SEAT_GAP_X = 34, SEAT_GAP_Y = 34, PADDING_LEFT = 50, PADDING_TOP = 70, SEAT_RADIUS = 12;

async function initSeats(eventId, ticketTypes, venueKey) {
  const v = venueDefs[venueKey];
  let batch = db.batch();
  let count = 0;
  for (let row = 1; row <= v.rows; row++) {
    let ticketType = "Standard";
    const match = ticketTypes.find(t => t.rows && t.rows.includes(row));
    if (match) ticketType = match.type;
    for (let seat = 1; seat <= v.seatsPerRow; seat++) {
      const seatId = `${String.fromCharCode(64 + row)}${seat}`;
      const seatRef = db.collection("seats").doc(`${eventId}_${seatId}`);
      batch.set(seatRef, {
        eventId, seatId, row, col: seat,
        x: PADDING_LEFT + (seat - 1) * SEAT_GAP_X + SEAT_RADIUS,
        y: PADDING_TOP  + (row  - 1) * SEAT_GAP_Y + SEAT_RADIUS,
        ticketType,
        status: "available",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
      if (count % 400 === 0) { await batch.commit(); batch = db.batch(); }
    }
  }
  if (count % 400 !== 0) await batch.commit();
  return count;
}

/* ── 50 Event definitions ──────────────────────────────────────── */
const eventDefs = [
  // ═══ Bucharest events (30) ═══
  // Music – seated
  { title: "Summer Symphony Night",        desc: "Full orchestra under the stars.",                        cat: "Music",    vk: "sala",     seated: true,  vipR: [1,2,3],   sp: 80,  vp: 150, poster: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&h=400&fit=crop" },
  { title: "Indie Rock Collective",        desc: "Local bands and guest headliners.",                     cat: "Music",    vk: "control",  seated: true,  vipR: [1],        sp: 55,  vp: 90,  poster: "https://images.unsplash.com/photo-1501386761578-0a55d7afa813?w=600&h=400&fit=crop" },
  { title: "Jazz & Wine Evening",          desc: "Smooth jazz with a curated wine list.",                 cat: "Music",    vk: "beraria",  seated: true,  vipR: [1,2],      sp: 70,  vp: 120, poster: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop" },
  { title: "Electronic Beats Festival",    desc: "Top DJs on one massive stage.",                         cat: "Music",    vk: "arenele",  seated: false, vipR: [],         sp: 60,  vp: 110, poster: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop" },
  { title: "Classical Piano Recital",      desc: "Works by Chopin and Liszt.",                            cat: "Music",    vk: "national", seated: true,  vipR: [1,2,3],    sp: 90,  vp: 160, poster: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&h=400&fit=crop" },
  { title: "Bucharest Blues Night",        desc: "Delta blues meets the big city.",                       cat: "Music",    vk: "expirat",  seated: true,  vipR: [1],        sp: 45,  vp: 80,  poster: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop" },
  { title: "Pop Hits Live",               desc: "Chart-toppers performed live.",                          cat: "Music",    vk: "grand",    seated: true,  vipR: [1,2],      sp: 75,  vp: 130, poster: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&h=400&fit=crop" },
  { title: "Folklore & Fanfare",          desc: "Traditional Romanian music celebration.",                cat: "Music",    vk: "sala",     seated: true,  vipR: [1,2,3,4],  sp: 65,  vp: 110, poster: "https://images.unsplash.com/photo-1504704911898-68304a7d2538?w=600&h=400&fit=crop" },

  // Theatre – seated
  { title: "Shakespeare in the Park",     desc: "A Midsummer Night's Dream — reserved seating.",          cat: "Theatre",  vk: "grand",    seated: true,  vipR: [1,2,3],    sp: 70,  vp: 120, poster: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop" },
  { title: "Opera Gala",                  desc: "Full operatic production with live orchestra.",           cat: "Theatre",  vk: "opera",    seated: true,  vipR: [1,2,3],    sp: 95,  vp: 170, poster: "https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=600&h=400&fit=crop" },
  { title: "Modern Dance Showcase",       desc: "Contemporary choreography from emerging artists.",        cat: "Theatre",  vk: "studio",   seated: true,  vipR: [1,2],      sp: 60,  vp: 100, poster: "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=600&h=400&fit=crop" },
  { title: "The Phantom Returns",         desc: "Musical theatre spectacular.",                            cat: "Theatre",  vk: "national", seated: true,  vipR: [1,2,3],    sp: 85,  vp: 150, poster: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&h=400&fit=crop" },
  { title: "Dracula: The Stage Show",     desc: "Bram Stoker's classic reimagined for stage.",             cat: "Theatre",  vk: "sala",     seated: true,  vipR: [1,2],      sp: 75,  vp: 130, poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&h=400&fit=crop" },

  // Comedy
  { title: "Stand-Up Saturday",           desc: "Comedy showcase with openers and headliner.",             cat: "Comedy",   vk: "control",  seated: true,  vipR: [1],        sp: 50,  vp: 85,  poster: "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=600&h=400&fit=crop" },
  { title: "Improv Battle Royale",        desc: "Two teams, no script, pure laughs.",                      cat: "Comedy",   vk: "expirat",  seated: true,  vipR: [1],        sp: 40,  vp: 70,  poster: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=400&fit=crop" },
  { title: "Comedy Open Mic",             desc: "New voices, fresh jokes.",                                cat: "Comedy",   vk: "beraria",  seated: false, vipR: [],         sp: 35,  vp: 60,  poster: "https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?w=600&h=400&fit=crop" },
  { title: "Late Night Laughs",           desc: "After-dark comedy special.",                              cat: "Comedy",   vk: "fratelli", seated: true,  vipR: [1,2],      sp: 55,  vp: 95,  poster: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop" },

  // Sports – mostly GA
  { title: "National League Finals",      desc: "Championship match — general admission.",                 cat: "Sports",   vk: "arenele",  seated: false, vipR: [],         sp: 50,  vp: 100, poster: "https://images.unsplash.com/photo-1461896836934-bd45ba9a50fe?w=600&h=400&fit=crop" },
  { title: "Boxing Night Bucharest",      desc: "Title bout plus undercard.",                              cat: "Sports",   vk: "sala",     seated: false, vipR: [],         sp: 70,  vp: 140, poster: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&h=400&fit=crop" },
  { title: "E-Sports Arena Showdown",     desc: "Top teams compete on the big screen.",                    cat: "Sports",   vk: "fratelli", seated: true,  vipR: [1,2],      sp: 45,  vp: 80,  poster: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop" },
  { title: "Marathon Kick-Off Party",     desc: "Pre-race meetup and expo.",                               cat: "Sports",   vk: "control",  seated: false, vipR: [],         sp: 25,  vp: 50,  poster: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=600&h=400&fit=crop" },

  // Festival / Conference – mostly GA
  { title: "Tech Conference Live",        desc: "Keynotes and panels — open seating.",                     cat: "Festival", vk: "grand",    seated: false, vipR: [],         sp: 90,  vp: 160, poster: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop" },
  { title: "Street Food Festival",        desc: "Tastes from around the world.",                           cat: "Festival", vk: "arenele",  seated: false, vipR: [],         sp: 30,  vp: 55,  poster: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop" },
  { title: "Bucharest Art Week",          desc: "Installations, galleries and live painting.",              cat: "Festival", vk: "beraria",  seated: false, vipR: [],         sp: 40,  vp: 70,  poster: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=600&h=400&fit=crop" },
  { title: "Wine & Cheese Expo",          desc: "Premium tastings from local producers.",                  cat: "Festival", vk: "fratelli", seated: false, vipR: [],         sp: 55,  vp: 95,  poster: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop" },
  { title: "Book Fair Bucharest",         desc: "Author signings, readings and panels.",                   cat: "Festival", vk: "national", seated: false, vipR: [],         sp: 20,  vp: 40,  poster: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=400&fit=crop" },

  // Extra mix
  { title: "Reggae Sunrise Session",      desc: "Early morning vibes and live jams.",                      cat: "Music",    vk: "expirat",  seated: false, vipR: [],         sp: 35,  vp: 60,  poster: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=600&h=400&fit=crop" },
  { title: "Magic & Illusions Show",      desc: "World-class magician live on stage.",                     cat: "Theatre",  vk: "studio",   seated: true,  vipR: [1,2],      sp: 65,  vp: 110, poster: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop" },
  { title: "Salsa Night Fiesta",          desc: "Live band, dance floor, and lessons.",                    cat: "Music",    vk: "beraria",  seated: false, vipR: [],         sp: 40,  vp: 70,  poster: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop" },
  { title: "Charity Gala Concert",        desc: "All proceeds to local children's hospitals.",             cat: "Music",    vk: "opera",    seated: true,  vipR: [1,2,3,4],  sp: 100, vp: 200, poster: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop" },

  // ═══ Cluj-Napoca events (5) ═══
  { title: "Cluj Jazz Festival",          desc: "International jazz acts in the heart of Transylvania.",   cat: "Music",    vk: "clujForm", seated: true,  vipR: [1,2],      sp: 60,  vp: 105, poster: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&h=400&fit=crop" },
  { title: "Untold Warm-Up Party",        desc: "Pre-festival electronic session.",                        cat: "Music",    vk: "clujForm", seated: false, vipR: [],         sp: 45,  vp: 80,  poster: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop" },
  { title: "Cluj Comedy Nights",          desc: "Stand-up in Romanian and English.",                       cat: "Comedy",   vk: "clujForm", seated: true,  vipR: [1],        sp: 40,  vp: 70,  poster: "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=600&h=400&fit=crop" },
  { title: "Opera Transylvania",          desc: "Classic opera performed at the National Theatre.",        cat: "Theatre",  vk: "clujNat",  seated: true,  vipR: [1,2,3],    sp: 85,  vp: 150, poster: "https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=600&h=400&fit=crop" },
  { title: "Cluj Tech Meetup",            desc: "Speakers from top Romanian startups.",                    cat: "Festival", vk: "clujNat",  seated: false, vipR: [],         sp: 30,  vp: 55,  poster: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop" },

  // ═══ Timișoara events (3) ═══
  { title: "Timișoara Rock Arena",        desc: "Heavy riffs echo through the mall arena.",                cat: "Music",    vk: "tmCap",    seated: true,  vipR: [1,2],      sp: 55,  vp: 95,  poster: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&h=400&fit=crop" },
  { title: "Banat Folk Evening",          desc: "Traditional music from the Banat region.",               cat: "Music",    vk: "tmCap",    seated: true,  vipR: [1],        sp: 50,  vp: 85,  poster: "https://images.unsplash.com/photo-1504704911898-68304a7d2538?w=600&h=400&fit=crop" },
  { title: "TM Stand-Up Show",            desc: "Timișoara's funniest take the stage.",                    cat: "Comedy",   vk: "tmCap",    seated: false, vipR: [],         sp: 35,  vp: 60,  poster: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=400&fit=crop" },

  // ═══ Iași events (3) ═══
  { title: "Iași Symphony Orchestra",     desc: "Moldavian philharmonic performs Brahms.",                 cat: "Music",    vk: "iasiPal",  seated: true,  vipR: [1,2,3],    sp: 75,  vp: 135, poster: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&h=400&fit=crop" },
  { title: "Poetry & Prose Night",        desc: "Live readings by award-winning Romanian authors.",        cat: "Theatre",  vk: "iasiPal",  seated: true,  vipR: [1,2],      sp: 40,  vp: 70,  poster: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=400&fit=crop" },
  { title: "FIE Tech Conference",         desc: "Innovation and entrepreneurship in Iași.",                cat: "Festival", vk: "iasiPal",  seated: false, vipR: [],         sp: 50,  vp: 90,  poster: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop" },

  // ═══ Brașov events (3) ═══
  { title: "Mountain Film Festival",      desc: "Documentaries and shorts about the Carpathians.",        cat: "Festival", vk: "bvPat",    seated: true,  vipR: [1,2],      sp: 45,  vp: 80,  poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop" },
  { title: "Brașov Acoustic Sessions",   desc: "Unplugged performances in an intimate venue.",            cat: "Music",    vk: "bvPat",    seated: true,  vipR: [1],        sp: 50,  vp: 85,  poster: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=400&fit=crop" },
  { title: "Transylvania Comedy Fest",    desc: "Comedians from across Romania compete.",                  cat: "Comedy",   vk: "bvPat",    seated: true,  vipR: [1,2],      sp: 40,  vp: 70,  poster: "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=600&h=400&fit=crop" },

  // ═══ Constanța events (2) ═══
  { title: "Black Sea Jazz Night",        desc: "Seaside jazz with sunset views.",                         cat: "Music",    vk: "ctCaz",    seated: true,  vipR: [1,2],      sp: 65,  vp: 115, poster: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop" },
  { title: "Summer Theatre by the Sea",   desc: "Open-air drama at the historic Casino.",                  cat: "Theatre",  vk: "ctCaz",    seated: true,  vipR: [1,2,3],    sp: 55,  vp: 95,  poster: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop" },

  // ═══ Sibiu events (2) ═══
  { title: "Sibiu International Theatre", desc: "Part of the famous FITS festival programme.",             cat: "Theatre",  vk: "sbTeat",   seated: true,  vipR: [1,2,3],    sp: 80,  vp: 145, poster: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&h=400&fit=crop" },
  { title: "Medieval Music Night",        desc: "Period instruments in the old town centre.",              cat: "Music",    vk: "sbTeat",   seated: true,  vipR: [1,2],      sp: 55,  vp: 95,  poster: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop" },

  // ═══ Craiova events (2) ═══
  { title: "Craiova Philharmonic Gala",   desc: "Season-opening orchestral performance.",                  cat: "Music",    vk: "cvNat",    seated: true,  vipR: [1,2],      sp: 60,  vp: 105, poster: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&h=400&fit=crop" },
  { title: "Oltenia Dance Festival",      desc: "Traditional and modern dance from the south.",            cat: "Theatre",  vk: "cvNat",    seated: true,  vipR: [1],        sp: 45,  vp: 75,  poster: "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=600&h=400&fit=crop" }
];

/* ── Main ──────────────────────────────────────────────────────── */
async function run() {
  console.log("Wiping old data …");
  const wiped = {};
  for (const col of ["events", "venues", "seats", "seat_reservations"]) {
    wiped[col] = await wipeCollection(col);
  }
  console.log("Deleted:", wiped);

  /* ── Seed venues ────────────────────────────────────────────── */
  const venueIds = {};
  let batch = db.batch();
  for (const [key, v] of Object.entries(venueDefs)) {
    const ref = db.collection("venues").doc();
    batch.set(ref, {
      name: v.name,
      address: v.address,
      rows: v.rows,
      seatsPerRow: v.seatsPerRow,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    venueIds[key] = ref.id;
  }
  await batch.commit();

  /* ── Seed events + seats ───────────────────────────────────── */
  batch = db.batch();
  let n = 0;
  const flush = async () => { await batch.commit(); batch = db.batch(); n = 0; };
  const seatedEvents = [];

  for (let i = 0; i < eventDefs.length; i++) {
    const def = eventDefs[i];
    const v = venueDefs[def.vk];
    const ref = eventsColl.doc();
    const eventDate = dayFromNow(7 + i * 2, 14 + i * 2);

    const tickets = def.seated
      ? seatedTickets(def.vk, def.vipR, def.sp, def.vp)
      : gaTickets(def.sp, def.vp, v.rows * v.seatsPerRow, Math.ceil(v.rows * v.seatsPerRow * 0.15));

    const doc = {
      title: def.title,
      description: def.desc,
      category: def.cat,
      date: eventDate,
      time: times[i % times.length],
      location: { venue: v.name, city: v.address },
      venueId: venueIds[def.vk],
      hasSeating: def.seated,
      venueRows: def.seated ? v.rows : 0,
      venueSeatsPerRow: def.seated ? v.seatsPerRow : 0,
      ticketTypes: tickets,
      posterUrl: def.poster || "",
      organizer: { id: "seed", name: "Bilete Events", email: "events@example.com" },
      isActive: true,
      eventId: ref.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    batch.set(ref, doc);
    n++;
    if (n >= 400) await flush();
    if (def.seated) seatedEvents.push({ id: ref.id, tickets, venueKey: def.vk });
  }
  if (n > 0) await flush();

  /* ── Init seats for seated events ──────────────────────────── */
  let totalSeats = 0;
  for (const ev of seatedEvents) {
    totalSeats += await initSeats(ev.id, ev.tickets, ev.venueKey);
  }

  console.log(
    `Seeded ${venueKeys.length} venues, ${eventDefs.length} events, ${totalSeats} seats (project: ${serviceAccount.project_id}).`
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
