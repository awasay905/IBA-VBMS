import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load the environment variables from .env.test
dotenv.config({ path: ".env.test" });

async function run() {
    const mode = process.argv[2]; // --init or --seed

    if (!mode || (mode !== "--init" && mode !== "--seed")) {
        console.error("Usage: ts-node scripts/seedDb.ts --init | --seed");
        process.exit(1);
    }

    // Use DATABASE_URL from .env.test
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("Error: DATABASE_URL not found in .env.test");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }, // Required for Supabase remote connections
    });

    try {
        await client.connect();
        console.log(`Connected to Supabase. Mode: ${mode}`);

        const fileName = mode === "--init" ? "init.sql" : "seedTestData.sql";
        const filePath = path.join(__dirname, "../test-data", fileName);

        console.log(`Reading file: ${filePath}`);
        const sql = fs.readFileSync(filePath, "utf8");

        console.log(`Executing SQL...`);
        await client.query(sql);

        console.log(`✅ Successfully executed ${fileName}`);
    } catch (err: any) {
        console.error(`❌ Error during ${mode}:`);
        console.error(err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
