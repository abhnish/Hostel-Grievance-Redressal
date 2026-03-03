const express = require("express");
const wardRoutes = express.Router();
const db = require("../db");

// Get all wards
wardRoutes.get("/wards", async (req, res) => {
  try {
    const result = await db.pool.query("SELECT * FROM wards ORDER BY ward_name");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = wardRoutes;
