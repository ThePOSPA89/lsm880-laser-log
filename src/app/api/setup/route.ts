import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS measurements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        system VARCHAR(100) NOT NULL,
        operator VARCHAR(100) NOT NULL DEFAULT '',
        objective VARCHAR(200) NOT NULL DEFAULT '',
        power_405 REAL,
        power_458 REAL,
        power_488 REAL,
        power_514 REAL,
        power_561 REAL,
        power_633 REAL,
        note TEXT NOT NULL DEFAULT ''
      );
    `;
    return NextResponse.json({ message: "Table created successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
