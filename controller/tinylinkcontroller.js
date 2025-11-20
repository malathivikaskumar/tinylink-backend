import validator from "validator";
import * as db from "../db/tinylinkrepository.js";

const CODE_MIN = 6;

function isValidUrl(url) {
  return validator.isURL(url, {
    protocols: ["http", "https"],
    require_protocol: true
  });
}

export async function createLink(req, res) {
  try {
    const { target, code } = req.body || {};

    if (!target || !isValidUrl(target)) {
      return res.status(400).json({ error: "Invalid target URL" });
    }

    let finalCode = code;

    if (finalCode) {
      if (!db.isValidCode(finalCode)) {
        return res.status(400).json({ error: "Code must be 6–8 alphanumeric" });
      }

      const existing = await db.findLinkByCode(finalCode);

      if (existing && !existing.deleted) {
        return res.status(409).json({ error: "Code already exists" });
      }

      if (existing && existing.deleted) {
        const reused = await db.reuseDeletedLink(finalCode, target);
        return res.status(201).json(reused);
      }
    }

    if (!finalCode) {
      let attempts = 0;
      while (attempts < 10) {
        const generated = db.genCode(CODE_MIN);
        const exists = await db.findLinkByCode(generated);
        if (!exists) {
          finalCode = generated;
          break;
        }
        attempts++;
      }

      if (!finalCode) {
        return res.status(500).json({ error: "Failed to generate unique code" });
      }
    }

    const created = await db.insertLink(finalCode, target);
    return res.status(201).json(created);

  } catch (err) {
    console.error("Error in createLink:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAllLinks(req, res) {
  const data = await db.listLinks();
  res.json(data);
}



export async function deleteLink(req, res) {
  const code = req.params.code;

  if (!db.isValidCode(code)) {
    return res.status(400).json({ error: "Invalid code" });
  }

  const link = await db.findLinkByCode(code);

  if (!link || link.deleted) {
    return res.status(404).json({ error: "Not found" });
  }

  await db.softDeleteLink(code);

  res.json({ ok: true });
}

export async function redirectLink(req, res) {
  const code = req.params.code;

  if (!db.isValidCode(code)) return res.status(404).send("Not found");

  const link = await db.findLinkByCode(code);

  if (!link || link.deleted) return res.status(404).send("Not found");

  await db.incrementClick(code);

  return res.redirect(302, link.target);
}
