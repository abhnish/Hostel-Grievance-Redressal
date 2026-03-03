const express = require("express");
const cors = require("cors");
const app = express();
const db = require("../db");
const bcrypt = require("bcrypt");
const { jwtGenerator, jwtDecoder } = require("../utils/jwtToken");
app.use(cors());
app.use(express.json());

exports.userRegister = async (req, res) => {
  const { full_name, email, phone, password, role } = req.body;

  try {
    const user = await db.pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    let newUser = await db.pool.query(
      "INSERT INTO users (full_name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [full_name, email, phone, bcryptPassword, role]
    );

    const jwtToken = jwtGenerator(
      newUser.rows[0].user_id,
      newUser.rows[0].role
    );

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser.rows[0].user_id,
        full_name: newUser.rows[0].full_name,
        role: newUser.rows[0].role
      },
      jwtToken
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const jwtToken = jwtGenerator(user.rows[0].user_id, user.rows[0].role);
    
    return res.json({
      message: "Login successful",
      user: {
        id: user.rows[0].user_id,
        full_name: user.rows[0].full_name,
        role: user.rows[0].role
      },
      jwtToken
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
