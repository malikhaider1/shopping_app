-- Migration: Create images table for storing images as BLOBs
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data BLOB NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL
);
