"use strict";

const express = require("express");

const db = require("../db");
const router = new express.Router();

const { NotFoundError, BadRequestError } = require('../expressError');

/** GET /companies: get list of companies like {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
      FROM companies`);
  const companies = results.rows;

  return res.json({ companies });
});

/** GET /companies/:code: Get specific company.
 * Return obj of company: {company: {code, name, description}}
 * If the company given cannot be found, return a 404.
 */
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const result = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]);
  const company = result.rows[0];

  // TODO: be consistent w check
  if (company === undefined) throw new NotFoundError();

  return res.json({ company });
});

/** POST /companies: Add company. Needs to be given JSON like:
 *  {code, name, description}. Returns new company object. */
router.post("/", async function (req, res, next) {
  if (!req.body || req.body.name === undefined
    || req.body.description === undefined || req.body.code === undefined) {
    throw new BadRequestError();
  }

  const {code, name, description} = req.body;
  const result = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
    [code, name, description]
  );

  const company = result.rows[0];

  return res.status(201).json({ company });
});


/** PUT /companies/:code: Edit existing company.
 * Return 404 if company can't be found.
 * Needs to be given JSON like: {name, description}.
 * Returns updated company object. {company: {code, name, description}} */
router.put("/:code", async function (req, res, next) {
  if (!req.body || req.body.name === undefined
    || req.body.description === undefined) {
    throw new BadRequestError();
  }

  const {name, description} = req.body;
  const result = await db.query(
    `UPDATE companies
      SET name = $1,
          description = $2
      WHERE code = $3
      RETURNING code, name, description`,
    [name, description, req.params.code]
  );

  if (result.rows.length === 0) throw new NotFoundError();

  const company = result.rows[0];

  return res.json({ company });
});

/** DELETE /companies/:code: Deletes company.
 * Return 404 if company can't be found.
 * Returns {status: "deleted"} */
router.delete("/:code", async function (req, res, next) {

  const result = await db.query(
    `DELETE FROM companies WHERE code = $1
    RETURNING code`,
    [req.params.code]
  );

  if (result.rows.length === 0) throw new NotFoundError();

  return res.json({status: "deleted"});
});



module.exports = router;