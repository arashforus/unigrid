import { Router } from "express";
import { db } from "@workspace/db";
import { inquiriesTable } from "@workspace/db";

const router = Router();

router.post("/inquiries", async (req, res) => {
  const { full_name, email, phone, country, desired_field, degree_type, message } = req.body as Record<string, string>;

  if (!full_name?.trim()) {
    res.status(400).json({ error: "full_name is required" });
    return;
  }
  if (!email?.trim() || !email.includes("@")) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }

  const [row] = await db
    .insert(inquiriesTable)
    .values({
      full_name: full_name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      country: country?.trim() || null,
      desired_field: desired_field?.trim() || null,
      degree_type: degree_type?.trim() || null,
      message: message?.trim() || null,
    })
    .returning({ id: inquiriesTable.id });

  res.status(201).json({ id: row?.id, message: "Inquiry received successfully" });
});

export default router;
