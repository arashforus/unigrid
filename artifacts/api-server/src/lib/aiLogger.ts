/**
 * Thin wrapper: log every OpenAI call to the ai_requests table.
 * Call `logAiRequest` after (or around) each OpenAI API call.
 */

import { db } from "@workspace/db";
import { aiRequestsTable } from "@workspace/db";
import { logger } from "./logger";

export type AiLogEntry = {
  source: string;
  model: string;
  request_text?: string | null;
  response_text?: string | null;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  duration_ms?: number;
  status?: "success" | "error";
  error?: string | null;
  context?: Record<string, unknown>;
};

export async function logAiRequest(entry: AiLogEntry): Promise<void> {
  try {
    await db.insert(aiRequestsTable).values({
      source: entry.source,
      model: entry.model,
      status: entry.status ?? "success",
      prompt_tokens: entry.prompt_tokens ?? 0,
      completion_tokens: entry.completion_tokens ?? 0,
      total_tokens: entry.total_tokens ?? 0,
      duration_ms: entry.duration_ms ?? null,
      request_text: entry.request_text ?? null,
      response_text: entry.response_text ?? null,
      error: entry.error ?? null,
      context: entry.context ?? null,
    });
  } catch (err) {
    // Never let logging failures break the main flow
    logger.warn({ err }, "Failed to log AI request");
  }
}
