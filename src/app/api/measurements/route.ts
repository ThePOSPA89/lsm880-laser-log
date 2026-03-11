import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { rowToMeasurement, MeasurementRow } from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await sql<MeasurementRow>`
      SELECT * FROM measurements ORDER BY date DESC
    `;
    const measurements = rows.map(rowToMeasurement);
    return NextResponse.json(measurements);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, operator, objective, values, note } = body;

    const wavelengths = [405, 458, 488, 514, 561, 633];
    const hasAnyValue = wavelengths.some((wl) => values[wl] != null);
    if (!hasAnyValue) {
      return NextResponse.json(
        { error: "At least one laser power value is required" },
        { status: 400 }
      );
    }

    const { rows } = await sql<MeasurementRow>`
      INSERT INTO measurements (system, operator, objective, power_405, power_458, power_488, power_514, power_561, power_633, note)
      VALUES (
        ${system},
        ${operator || ""},
        ${objective || ""},
        ${values[405] ?? null},
        ${values[458] ?? null},
        ${values[488] ?? null},
        ${values[514] ?? null},
        ${values[561] ?? null},
        ${values[633] ?? null},
        ${note || ""}
      )
      RETURNING *
    `;

    const measurement = rowToMeasurement(rows[0]);
    return NextResponse.json(measurement, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Database error" },
      { status: 500 }
    );
  }
}
