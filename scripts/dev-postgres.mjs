// Local, Docker-free Postgres for development/verification only.
// Production and Docker Compose use the real `postgres:16-alpine` image (see docker-compose.yml).
// This exists so contributors without Docker installed can still run the full stack locally.
import EmbeddedPostgres from "embedded-postgres";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.POSTGRES_PORT ?? 5432);
const user = process.env.POSTGRES_USER ?? "blksm";
const password = process.env.POSTGRES_PASSWORD ?? "blksm_dev_password";
const database = process.env.POSTGRES_DB ?? "blksm_academy";

const pg = new EmbeddedPostgres({
  databaseDir: path.join(__dirname, "..", ".pgdata"),
  user,
  password,
  port,
  persistent: true,
});

try {
  await pg.initialise();
} catch {
  // Already initialised on a previous run.
}

await pg.start();

try {
  await pg.createDatabase(database);
  console.log(`Created database "${database}".`);
} catch {
  // Already exists.
}

console.log(`Embedded Postgres ready on port ${port}, database "${database}".`);
console.log("Press Ctrl+C to stop.");

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await pg.stop();
  process.exit(0);
});
