import app from "./app";
import { logger } from "./lib/logger";
import { ensureDatabase } from "@workspace/db/setup";
import path from "path";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// __dirname is injected by the esbuild banner and always points to the
// directory of the compiled entry file (dist/).  build.mjs copies
// lib/db/migrations → dist/migrations so the migrator can find the SQL files.
const migrationsFolder = path.join(__dirname, "migrations");

ensureDatabase({ migrationsFolder })
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Database setup failed");
    process.exit(1);
  });
