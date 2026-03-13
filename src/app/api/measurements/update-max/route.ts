import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, power_458_max, power_488_max, power_514_max } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await sql`
      UPDATE measurements
      SET power_458_max = ${power_458_max ?? null},
          power_488_max = ${power_488_max ?? null},
          power_514_max = ${power_514_max ?? null}
      WHERE id = ${id}
    `;

    return NextResponse.json({ updated: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Database error" },
      { status: 500 }
    );
  }
}
