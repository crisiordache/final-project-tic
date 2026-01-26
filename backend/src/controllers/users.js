const admin = require("../firebaseAdmin");
const User = require("../models/users");
const validateUser = require('../validators/users');

const registerUser = async (req, res) => {
  const { name, email } = req.body;
  const token = req.headers.authorization?.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    await User.create(uid, {
      email,
      name,
      role: "user"
    });

    res.status(201).json({ message: "Profile created successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userData = await User.getById(uid);

    res.status(200).json({
      message: "Success",
      user: userData
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid session" });
  }
}

const getUserById = async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userData = await User.getById(decodedToken.uid);
    res.json({ user: userData });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  } 
}

const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.status(200).json(users);
  } catch(error) {
    res.status(500).json({ message: error.message});
  }
}

const grantAdminAccess = async (req, res) => {
  const userId = req.params.id;
  try {
    if(!userId) {
      return res.status(400).json({ message: "User ID is required"});
    }
    await User.grantAdminAccess(userId);
    res.status(200).json( { message: 'Admin access granted' });
  } catch(error) {
    res.status(500).json({ message: error.message});
  }
}

const revokeAdminAccess = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.getById(userId);
    if(!user) {
      return res.status(404).json({ message: "User not found"});
    }

    if(user.email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: "Cannot revoke admin access from the main admin"});
    }
    await User.revokeAdminAccess(userId);
    res.status(200).json( { message: 'Admin access revoked' });
  } catch(error) {
    res.status(500).json({ message: error.message});
  }
}

module.exports = {
  registerUser,
  login,
  getUserById,
  getAllUsers,
  grantAdminAccess,
  revokeAdminAccess
};
