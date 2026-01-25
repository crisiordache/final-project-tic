const admin = require("../firebaseAdmin");
const User = require("../models/users");

const authMiddleware = async (req, res, next) => {
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

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Requires administrator rights" });
  }
}

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

module.exports = { authMiddleware, isAdmin, requireAuth };