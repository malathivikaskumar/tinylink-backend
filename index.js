// index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import {
  createLink,
  getAllLinks,
  getLinkStats,
  deleteLink,
  redirectLink
} from "./controller/tinylinkcontroller.js";


const app = express();
const PORT = process.env.PORT || 3000;
console.log("PORT:", process.env.PORT);

app.use(helmet());
app.use(express.json());
app.use(morgan("tiny"));

// API ROUTES

// Healthcheck
app.get("/healthz", (req, res) =>
  res.json({ ok: true, version: "1.0" })
);

app.post("/api/links", createLink);
app.get("/api/links", getAllLinks);
app.get("/api/links/:code", getLinkStats);
app.delete("/api/links/:code", deleteLink);

// Redirect handler
app.get("/:code", redirectLink);



// 404 fallback
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () =>
  console.log(`TinyLink backend running on http://localhost:${PORT}`)
);
