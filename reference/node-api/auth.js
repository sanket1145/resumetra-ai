import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { query } from "./db.js";

export async function register({ name, email, password }) {
  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name ?? null, email, hash],
  );
  return { id: result.insertId, name, email };
}

export async function login({ email, password }) {
  const rows = await query("SELECT id, name, email, password_hash FROM users WHERE email = ?", [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error("Invalid email or password.");
  }
  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing bearer token." });
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = Number(claims.sub);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}
