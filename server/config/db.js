// Sets up a reusable connection pool to PostgreSQL.
// Every route/controller imports `pool` from here to run queries.

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Most hosted Postgres providers (Neon, Supabase, Render) require SSL.
  // Locally, you can usually leave this off - toggle if you hit SSL errors.
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
  process.exit(-1);
});

module.exports = pool;
