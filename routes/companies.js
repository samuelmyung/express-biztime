const express = require("express");

const db = require("./fakeDb");
const router = new express.Router();

/** GET /companies: get list of users */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
      FROM companies`);
  const companies = results.rows

  return res.json({companies})
});

/** GET /companies:code get specific company */
router.get("/", async function (req, res) {
  const code = req.params.code;

  const results = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]);
  const company = results.rows[0]

  return res.json({company})
});


module.exports = router;