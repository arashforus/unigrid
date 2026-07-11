import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql, ne, and } from "drizzle-orm";

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

// PATCH /admin/users/:id
router.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body as { role?: string };

  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  if (!role || !["admin", "student"].includes(role)) {
    res.status(400).json({ error: "role must be 'admin' or 'student'" });
    return;
  }

  try {
    if (role === "student") {
      const [{ count: adminCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(eq(usersTable.role, "admin"));

      const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      if (target?.role === "admin" && adminCount <= 1) {
        res.status(409).json({ error: "Cannot demote the last remaining admin" });
        return;
      }
    }

    const [updated] = await db
      .update(usersTable)
      .set({ role })
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role });

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update user role");
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
