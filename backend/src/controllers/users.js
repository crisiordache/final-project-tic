const admin = require("../firebaseAdmin");
const User = require("../models/users");

async function registerUser(req, res) {
  const { email, password, name } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      displayName:name,
      password
    });

    const role = (email === process.env.ADMIN_EMAIL) ? "admin" : "user";

    await User.create(userRecord.uid, {
      email,
      name,
      role: (email === process.env.ADMIN_EMAIL) ? "admin" : "user"
    });

    res.status(201).json({ message: "User created" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

async function login(req, res) {
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

module.exports = {
  registerUser,
  login
};