"use strict";

const express = require("express");

const db = require("../db");
const router = new express.Router();

const { NotFoundError, BadRequestError } = require('../expressError');

/** GET /invoices: get list of invoices like {companies: [{id, comp_code}, ...]}
 */
router.get("/", async function(req, res) {
  const results = await db.query(
    `SELECT id, comp_code
      FROM invoices`);
  const invoices = results.rows;

  return res.json({ invoices });
});

/** GET /invoices:id get a specific invoice like
 * {invoice: {id, amt, paid, add_date, paid_date,
 * company: {code, name, description}}
 * If invoice cannot be found, throws a 404 error
 */
router.get("/:id", async function(req, res) {
  const result = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
      FROM invoices
      WHERE id = $1`, [req.params.id]);
  if (result.rows.length === 0){
    throw new NotFoundError();
  }
  const invoice = result.rows[0];

  const cResult = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [invoice.comp_code]);

  const company = cResult.rows[0];

  invoice.company = company;

  delete invoice.comp_code;

  return res.json({invoice});
});