// db/linkQueries.js
import { Pool } from "pg";
import { randomBytes } from "crypto";
import dotenv from "dotenv";
dotenv.config();

// Create a pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// -------------- Helpers -------------------

export function isValidCode(code) {
  return typeof code === "string" && /^[A-Za-z0-9]{6,8}$/.test(code);
}

export function genCode(length = 6) {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const random = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[random[i] % alphabet.length];
  }
  return out;
}

// -------------- DB Functions -------------------

export async function findLinkByCode(code) {
  const { rows } = await pool.query(
    "SELECT * FROM links WHERE code = $1 LIMIT 1",
    [code]
  );
  return rows[0];
}

export async function insertLink(code, target) {
  const { rows } = await pool.query(
    `INSERT INTO links (code, target)
     VALUES ($1, $2)
     RETURNING *`,
    [code, target]
  );
  return rows[0];
}

export async function reuseDeletedLink(code, target) {
  const { rows } = await pool.query(
    `UPDATE links
     SET target = $1,deleted = false, clicks = 0, last_clicked = NULL, created_at = now()
     WHERE code = $2
     RETURNING *`,
    [target, code]
  );
  return rows[0];
}

export async function listLinks() {
  const { rows } = await pool.query(
    `SELECT id, code, target, created_at, clicks, last_clicked
     FROM links WHERE deleted = false ORDER BY created_at DESC`
  );
  return rows;
}

export async function softDeleteLink(code) {
  await pool.query("UPDATE links SET deleted = true WHERE code = $1", [code]);
}

export async function incrementClick(code) {
  await pool.query(
    `UPDATE links
     SET clicks = clicks + 1, last_clicked = now()
     WHERE code = $1`,
    [code]
  );
}

export { pool };
