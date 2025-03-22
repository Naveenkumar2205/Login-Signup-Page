const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const sendVerificationEmail = require("./emailSender");

const app = express();
const port = 8082;
const SECRET_KEY = process.env.SECRET_KEY || "jngm ifbp xmyy ngss";

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const db = new sqlite3.Database("auth.db", (err) => {
  if (err) console.error("❌ Database connection error:", err.message);
  else console.error("✅ Connected to SQLite database.");
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      verified INTEGER DEFAULT 0,
      verification_code TEXT
    )`,
    (err) => {
      if (err) console.error("❌ Table creation error:", err.message);
      else console.error("✅ Users table ready.");
    }
  );
});

// Signup Route
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "❌ Email and password required" });

  console.error(`Attempting signup for: ${email}`);

  try {
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
      if (err) return res.status(500).json({ message: "❌ Database error" });
      if (row) return res.status(400).json({ message: "❌ User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      console.error("Inserting user:", { email, hashedPassword, verificationCode });

      db.run(
        "INSERT INTO users (email, password, verification_code) VALUES (?, ?, ?)",
        [email, hashedPassword, verificationCode],
        (insertErr) => {
          if (insertErr) {
            console.error("❌ Insert error:", insertErr.message);
            return res.status(500).json({ message: "❌ Signup failed" });
          }
          console.error(`User ${email} inserted successfully`);
          sendVerificationEmail(email, verificationCode);
          res.status(201).json({ message: "✅ Verification email sent. Please check your inbox." });
        }
      );
    });
  } catch (error) {
    console.error("❌ Signup route error:", error.message);
    res.status(500).json({ message: "❌ Signup failed unexpectedly" });
  }
});

// Verify Email Route
app.post("/api/verify-email", (req, res) => {
  const { email, code } = req.body;

  console.error(`Verifying email: ${email} with code: ${code}`);

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error("❌ Select error:", err.message);
      return res.status(500).json({ message: "❌ Database error" });
    }
    if (!user) {
      console.error(`User ${email} not found`);
      return res.status(404).json({ message: "❌ User not found" });
    }
    if (user.verification_code !== code) {
      console.error(`Invalid code for ${email}`);
      return res.status(400).json({ message: "❌ Invalid verification code" });
    }

    db.run("UPDATE users SET verified = 1, verification_code = NULL WHERE email = ?", [email], (updateErr) => {
      if (updateErr) {
        console.error("❌ Update error:", updateErr.message);
        return res.status(500).json({ message: "❌ Verification failed" });
      }
      console.error(`Email ${email} verified successfully`);
      res.json({ message: "✅ Email verified successfully! You can now log in." });
    });
  });
});

// Login Route
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  console.error(`Login attempt for: ${email}`);

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ message: "❌ Database error" });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "❌ Invalid email or password" });
    if (!user.verified) return res.status(403).json({ message: "❌ Please verify your email first." });

    const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: "1h" });
    console.error(`Login successful for ${email}`);
    res.json({ message: "✅ Login successful", token });
  });
});

// Protected Route
app.get("/api/protected", (req, res) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "❌ Access denied. No token provided." });

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    res.json({ message: "✅ This is a protected route", user: verified });
  } catch (error) {
    res.status(400).json({ message: "❌ Invalid token" });
  }
});

app.listen(port, () => console.error(`✅ Server running on http://localhost:${port}`));