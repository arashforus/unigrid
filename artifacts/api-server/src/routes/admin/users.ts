import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        created_at: usersTable.created_at,
      })
      .from(usersTable)
      .orderBy(usersTable.created_at);
    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/users — create a new user
router.post("/users", async (req, res) => {
  const { name, email, password, role } = req.body as Record<string, string>;

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  if (role && !["admin", "student"].includes(role)) {
    res.status(400).json({ error: "role must be 'admin' or 'student'" });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(password, 12);
    const [created] = await db
      .insert(usersTable)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash,
        role: (role as "admin" | "student") ?? "student",
      })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        created_at: usersTable.created_at,
      });
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    req.log.error({ err }, "Failed to create user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/users/:id — update name, email, password and/or role
router.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const { name, email, password, role } = req.body as Record<string, string>;

  if (role && !["admin", "student"].includes(role)) {
    res.status(400).json({ error: "role must be 'admin' or 'student'" });
    return;
  }
  if (password && password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Guard: cannot demote the last admin
    if (role === "student" && target.role === "admin") {
      const [{ count: adminCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(eq(usersTable.role, "admin"));
      if (adminCount <= 1) {
        res.status(409).json({ error: "Cannot demote the last remaining admin" });
        return;
      }
    }

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (email?.trim()) updates.email = email.toLowerCase().trim();
    if (role) updates.role = role;
    if (password) updates.password_hash = await bcrypt.hash(password, 12);

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        created_at: usersTable.created_at,
      });

    res.json(updated);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/users/:id
router.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  if (req.session.userId === id) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  try {
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (target.role === "admin") {
      const [{ count: adminCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(eq(usersTable.role, "admin"));
      if (adminCount <= 1) {
        res.status(409).json({ error: "Cannot delete the last remaining admin" });
        return;
      }
    }

    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
