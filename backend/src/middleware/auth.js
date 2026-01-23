const admin = require("../firebaseAdmin");
const User = require("../models/users");

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  const token = header.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userData = await User.getById(decodedToken.uid);
    
    if(userData) {
      req.user = userData;
    }
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Requires administrator rights" });
  }
}

module.exports = { authMiddleware, isAdmin };