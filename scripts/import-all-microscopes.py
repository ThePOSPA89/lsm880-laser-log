"""
Import historical laser measurement data from Excel files into the database.
Reads 6 microscope Excel files and POSTs each measurement via the API.

Wavelength mapping for non-standard wavelengths:
  638 -> 640 (red diode, close enough)
  560 -> 561 (DPSS yellow-green)
  630 -> 633 (HeNe red)
  515 -> 514 (Argon green)
  440 -> 440 (new column, Leica WLL)
  445 -> 445 (new column, Yokogawa)
  790 -> 790 (new column, Leica multiphoton)
"""

import sys
import json
import requests
import pandas as pd
import math
from datetime import datetime

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "https://lsm880-laser-log.vercel.app"
API = f"{BASE_URL}/api/measurements"

def parse_yymmdd(val):
    """Parse YYMMDD integer date to ISO string."""
    s = str(int(val)).strip()
    if len(s) == 6:
        yy, mm, dd = int(s[:2]), int(s[2:4]), int(s[4:6])
        year = 2000 + yy if yy < 50 else 1900 + yy
        return f"{year}-{mm:02d}-{dd:02d}T12:00:00Z"
    return None

def safe_float(val):
    """Convert value to float or None."""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    try:
        v = float(val)
        return v if not math.isnan(v) else None
    except (ValueError, TypeError):
        return None

def post_measurement(data):
    """POST a measurement to the API."""
    res = requests.post(API, json=data, timeout=30)
    if res.status_code == 201:
        return True
    else:
        print(f"  ERROR {res.status_code}: {res.text[:200]}")
        return False

def import_lsm800():
    """LSM800: 405, 488, 561, 640"""
    print("\n=== LSM800 (A2-Zeiss800_lasers.xlsx) ===")
    df = pd.read_excel("previousData/A2-Zeiss800_lasers.xlsx", header=None)
    count = 0
    for i in range(10, len(df)):
        row = df.iloc[i]
        date = parse_yymmdd(row[0])
        if not date:
            continue
        # col 1=405, 2=488, 3=561, 4=640, 5=unit, 6=note/instrument, 7=note2
        note_parts = [str(row[j]) for j in range(6, 8) if pd.notna(row[j])]
        note = " ".join(note_parts) if note_parts else ""
        # Instrument info from note (VEGA, argolight, etc.)
        instrument = str(row[5]) if pd.notna(row[5]) and str(row[5]).lower() != "mw" else ""
        if instrument.lower() == "mw":
            instrument = ""
        data = {
            "date": date, "system": "LSM800-A2", "operator": "",
            "objective": "10x/0.3 Dry",
            "values": {
                "405": safe_float(row[1]), "488": safe_float(row[2]),
                "561": safe_float(row[3]), "640": safe_float(row[4])
            },
            "note": note
        }
        if post_measurement(data):
            count += 1
    print(f"  Imported {count} records")

def import_lightsheet():
    """LightSheet: 405, 488, 561, 638->640"""
    print("\n=== LightSheet (A2-lightsheet_lasers.xlsx) ===")
    df = pd.read_excel("previousData/A2-lightsheet_lasers.xlsx", header=None)
    count = 0
    for i in range(10, len(df)):
        row = df.iloc[i]
        date = parse_yymmdd(row[0])
        if not date:
            continue
        note_parts = [str(row[j]) for j in range(6, 8) if pd.notna(row[j])]
        note = " ".join(note_parts) if note_parts else ""
        data = {
            "date": date, "system": "Lightsheet7-A2", "operator": "",
            "objective": "10x/0.3 Dry",
            "values": {
                "405": safe_float(row[1]), "488": safe_float(row[2]),
                "561": safe_float(row[3]), "640": safe_float(row[4])  # 638->640
            },
            "note": note
        }
        if post_measurement(data):
            count += 1
    print(f"  Imported {count} records")

def import_leica_falcon():
    """Leica Falcon: 440, 488, 560->561, 630->633, 790, 405, second_488->488_max"""
    print("\n=== Leica Falcon (Leica Stellaris Falcon 8.xlsx) ===")
    df = pd.read_excel("previousData/Leica Stellaris Falcon 8.xlsx", header=None)
    count = 0
    # Header at row 2: DATE, 440, 488, 560, 630, 790, 405, 488
    # Data starts at row 3
    for i in range(3, len(df)):
        row = df.iloc[i]
        date = parse_yymmdd(row[0])
        if not date:
            continue
        note_parts = [str(row[j]) for j in [9, 10] if pd.notna(row[j])]
        note = " ".join(note_parts) if note_parts else ""
        instrument = str(row[8]) if pd.notna(row[8]) and str(row[8]).lower() != "mw" else ""
        data = {
            "date": date, "system": "Falcon-A2", "operator": "",
            "objective": "10x/0.3 Dry",
            "values": {
                "440": safe_float(row[1]),      # WLL 440
                "488": safe_float(row[2]),      # WLL 488
                "561": safe_float(row[3]),      # 560->561
                "633": safe_float(row[4]),      # 630->633
                "790": safe_float(row[5]),      # multiphoton
                "405": safe_float(row[6]),      # diode 405
                "488_max": safe_float(row[7]),  # dedicated 488
            },
            "note": note
        }
        if post_measurement(data):
            count += 1
    print(f"  Imported {count} records")

def import_lsm910():
    """LSM910: 405, 488, 561, 640"""
    print("\n=== LSM910 (E26-LSM910-lasers.xlsx) ===")
    df = pd.read_excel("previousData/E26-LSM910-lasers.xlsx", sheet_name="List1", header=None)
    count = 0
    # Header at row 23, data from row 25
    for i in range(25, len(df)):
        row = df.iloc[i]
        date = parse_yymmdd(row[0])
        if not date:
            continue
        note = str(row[7]) if pd.notna(row[7]) else ""
        data = {
            "date": date, "system": "LSM910-E26", "operator": note,
            "objective": "10x/0.3 Dry",
            "values": {
                "405": safe_float(row[1]), "488": safe_float(row[2]),
                "561": safe_float(row[3]), "640": safe_float(row[4])
            },
            "note": ""
        }
        if post_measurement(data):
            count += 1
    print(f"  Imported {count} records")

def import_yokogawa():
    """Yokogawa SoRa: 405, 445, 488, 515->514, 561, 638->640"""
    print("\n=== YokogawaSoRa (LaserMeasurementLog.xlsx) ===")
    df = pd.read_excel("previousData/LaserMeasurementLog.xlsx", header=None)
    count = 0
    # Header at row 9: Date, Time, 405, 445, 488, 515, 561, 638, 405-FRAP, 488-FRAP, Unit, Instrument, Measured by, Note
    for i in range(10, len(df)):
        row = df.iloc[i]
        if not pd.notna(row[0]):
            continue
        # Date is datetime object
        dt = row[0]
        if isinstance(dt, datetime):
            date = dt.strftime("%Y-%m-%dT12:00:00Z")
        else:
            continue

        # Skip fiber power measurements (not at objective)
        note = str(row[13]) if len(df.columns) > 13 and pd.notna(row[13]) else ""
        if "fiber" in note.lower():
            continue

        operator = str(row[12]) if len(df.columns) > 12 and pd.notna(row[12]) else ""
        instrument = str(row[11]) if len(df.columns) > 11 and pd.notna(row[11]) else ""

        data = {
            "date": date, "system": "YokogawaSORA-E26", "operator": operator,
            "objective": "10x/0.3 Dry",
            "values": {
                "405": safe_float(row[2]),
                "445": safe_float(row[3]),
                "488": safe_float(row[4]),
                "514": safe_float(row[5]),   # 515->514
                "561": safe_float(row[6]),
                "640": safe_float(row[7]),   # 638->640
            },
            "note": note
        }
        if post_measurement(data):
            count += 1
    print(f"  Imported {count} records")

def import_lsm780():
    """LSM780: 405, 561, 633, 458, 488, 514, 458_max, 488_max, 514_max"""
    print("\n=== LSM780 (A26-Zeiss780_lasers.xlsx) ===")
    df = pd.read_excel("previousData/A26-Zeiss780_lasers.xlsx", header=None)
    count = 0
    # Header at row 10: Date, 405, 561, 633, 458_optimal, 488_optimal, 514_optimal, 458_max, 488_max, 514_max
    # Row 12 is filter description, skip it
    for i in range(11, len(df)):
        row = df.iloc[i]
        date = parse_yymmdd(row[0]) if pd.notna(row[0]) else None
        if not date:
            continue
        # Skip row 12 (filter description row)
        if isinstance(row[1], str) and "MBS" in str(row[1]):
            continue

        note_parts = [str(row[j]) for j in range(10, min(13, len(df.columns))) if pd.notna(row[j]) and str(row[j]).lower() != "mw"]
        note = " ".join(note_parts) if note_parts else ""

        data = {
            "date": date, "system": "LSM780_Airy-A26", "operator": "",
            "objective": "10x/0.3 Dry",
            "values": {
                "405": safe_float(row[1]),
                "561": safe_float(row[2]),
                "633": safe_float(row[3]),
                "458": safe_float(row[4]),       # 458_optimal
                "488": safe_float(row[5]),       # 488_optimal
                "514": safe_float(row[6]),       # 514_optimal
                "458_max": safe_float(row[7]),
                "488_max": safe_float(row[8]),
                "514_max": safe_float(row[9]),
            },
            "note": note
        }
        if post_measurement(data):
            count += 1
    print(f"  Imported {count} records")


if __name__ == "__main__":
    print(f"Importing to: {API}")

    # First run DB migration to add new columns
    print("\nRunning DB migration (setup)...")
    setup_url = f"{BASE_URL}/api/setup"
    res = requests.get(setup_url, timeout=30)
    print(f"  Setup: {res.status_code} - {res.text[:200]}")

    import_lsm800()
    import_lightsheet()
    import_leica_falcon()
    import_lsm910()
    import_yokogawa()
    import_lsm780()

    print("\n=== Import complete! ===")
