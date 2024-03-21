"use strict";

const express = require("express");

const db = require("../db");
const router = new express.Router();

const { NotFoundError, BadRequestError } = require('../expressError');

/** GET /invoices: get list of invoices like {companies: [{id, comp_code}, ...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
      FROM invoices`);
  const invoices = results.rows;

  return res.json({ invoices });
});

/** GET /invoices:id: get a specific invoice like
 * {invoice: {id, amt, paid, add_date, paid_date,
 * company: {code, name, description}}
 * If invoice cannot be found, throws a 404 error
 */
router.get("/:id", async function (req, res) {
  // const result = await db.query(
  //   `SELECT id, amt, paid, add_date, paid_date, comp_code
  //     FROM invoices
  //     WHERE id = $1`, [req.params.id]);
  // if (result.rows.length === 0) {
  //   throw new NotFoundError("Invoice doesn't exist");
  // }
  // const invoice = result.rows[0];

  // const cResult = await db.query(
  //   `SELECT code, name, description
  //     FROM companies
  //     WHERE code = $1`, [invoice.comp_code]);

  // const company = cResult.rows[0];
  // invoice.company = company;

  // delete invoice.comp_code;

  const result = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, code, name, description
    FROM invoices AS i
    JOIN companies AS c ON i.comp_code = c.code
    WHERE i.id = $1`,
    [req.params.id]
  );

  const invoice = result.rows[0];

  invoice.company = {
    code: invoice.code,
    name: invoice.name,
    description: invoice.description
  };

  delete invoice.code;
  delete invoice.name;
  delete invoice.description;

  return res.json({invoice});
});


/** POST /invoices: Add an invoice.
 * Needs to be passed in JSON body of: {comp_code, amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res) {
  if (!req.body || req.body.comp_code === undefined
    || req.body.amt === undefined) {
    throw new BadRequestError("Incorrect JSON body passed");
  }

  const cResult = await db.query(
    `SELECT code
      FROM companies
      WHERE code = $1`, [req.body.comp_code]);
  if (cResult.rows.length === 0) throw new NotFoundError("Company doesn't exist");

  const { comp_code, amt } = req.body;
  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]);

  const invoice = result.rows[0];

  return res.status(201).json({ invoice });
});


/** PUT /invoices/:id: Updates an invoice.
 * If invoice not found, returns 404.
 * Needs to be passed in JSON body of: {amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put("/:id", async function (req, res) {
  if (!req.body || req.body.amt === undefined) {
    throw new BadRequestError("Incorrect JSON body passed");
  }

  const { amt} = req.body;

  const result = await db.query(
    `UPDATE invoices
      SET amt = $1
      WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, req.params.id]);

  if (result.rows.length === 0) throw new NotFoundError("Invoice doesn't exist");


  const invoice = result.rows[0];

  return res.json({ invoice });
});

/** DELETE /invoices:id: Delete an invoice.
 * If invoice not found, returns 404.
 * Returns: {status: "deleted"}
 */
router.delete("/:id", async function (req, res) {
  const result = await db.query(
    `DELETE FROM invoices
      WHERE id = $1
      RETURNING id`,
    [req.params.id]);

  if (result.rows.length === 0) throw new NotFoundError("Invoice doesn't exist");

  return res.json({ status: "deleted" });
});


module.exports = router;