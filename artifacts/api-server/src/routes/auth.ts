import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

declare module "express-session" {
  interface SessionData {
    userId: number;
    userEmail: string;
    userName: string;
    userRole: string;
  }
}

const router = Router();

// GET /api/auth/me
router.get("/auth/me", (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({
    user: {
      id: req.session.userId,
      email: req.session.userEmail,
      name: req.session.userName,
      role: req.session.userRole,
    },
  });
});

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body as Record<string, string>;

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ name: name.trim(), email: email.toLowerCase().trim(), password_hash })
    .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role });

  req.session.userId = user.id;
  req.session.userEmail = user.email;
  req.session.userName = user.name;
  req.session.userRole = user.role;

  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as Record<string, string>;

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;
  req.session.userEmail = user.email;
  req.session.userName = user.name;
  req.session.userRole = user.role;

  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// POST /api/auth/logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

export default router;
