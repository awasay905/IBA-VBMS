import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load the environment variables from .env.test
dotenv.config({ path: ".env.test" });

export async function resetDatabase() {
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
        console.log(`Connected to Supabase.`);

        const filePath = path.join(__dirname, "./../../test-data", "seedTestData.sql");

        console.log(`Reading file: ${filePath}`);
        const sql = fs.readFileSync(filePath, "utf8");

        console.log(`Executing SQL...`);
        await client.query(sql);

        console.log(`✅ Successfully executed seedTestData.sql`);
    } catch (err: any) {
        console.error(`❌ Error during seeding:`);
        console.error(err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}