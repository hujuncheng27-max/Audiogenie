import os
import sqlite3
from pathlib import Path

# Resolve the backend/ directory reliably:
# Go from backend/app/services/database.py → backend/
_THIS_FILE = Path(os.path.abspath(__file__))
_DB_DIR = _THIS_FILE.parent.parent.parent  # services → app → backend
_DB_PATH = _DB_DIR / "audiogenie.db"


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection with row-factory enabled."""
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    """Create tables if they don't already exist, and seed mock data."""
    conn = get_connection()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS generations (
                id          TEXT PRIMARY KEY,
                status      TEXT NOT NULL DEFAULT 'pending',
                art_title   TEXT,
                art_type    TEXT,
                art_duration TEXT,
                art_heights TEXT
            );

            CREATE TABLE IF NOT EXISTS uploads (
                ref      TEXT PRIMARY KEY,
                filename TEXT NOT NULL
            );
        """)

        # Seed mock data only if the table is empty (first run).
        row = conn.execute("SELECT COUNT(*) AS cnt FROM generations").fetchone()
        if row["cnt"] == 0:
            seed = [
                ("1", "completed", "Synthesis_A1", "SFX",        "00:12.4s", "4,8,12,16,24,20,14,10,12,18,22,16,12,8,4"),
                ("2", "completed", "Synthesis_B2", "Speech",     "00:08.2s", "8,12,16,24,20,14,10,12,18,22,16,12,8,4,8"),
                ("3", "completed", "Synthesis_C3", "Atmosphere", "00:30.0s", "12,16,24,20,14,10,12,18,22,16,12,8,4,8,12"),
            ]
            conn.executemany(
                "INSERT INTO generations (id, status, art_title, art_type, art_duration, art_heights) VALUES (?,?,?,?,?,?)",
                seed,
            )

        conn.commit()
    finally:
        conn.close()
