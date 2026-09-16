import sqlite3
import json
from contextlib import contextmanager
from datetime import datetime, timezone
from app.config import DB_PATH

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL COLLATE NOCASE,
                email TEXT,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Games table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                total_score REAL NOT NULL,
                rounds_count INTEGER NOT NULL DEFAULT 4,
                game_mode TEXT NOT NULL DEFAULT 'classic',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Check and migrate games table if game_mode column is missing in existing db
        cursor.execute("PRAGMA table_info(games)")
        existing_cols = [row["name"] for row in cursor.fetchall()]
        if "game_mode" not in existing_cols:
            cursor.execute("ALTER TABLE games ADD COLUMN game_mode TEXT NOT NULL DEFAULT 'classic'")
        
        # Game rounds table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS game_rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                round_number INTEGER NOT NULL,
                prompt_name TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                score_earned REAL NOT NULL,
                doodle_image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
            )
        """)
        
        # Indexes for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_game_rounds_game_id ON game_rounds(game_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_games_score ON games(total_score DESC)")

def _format_iso_utc(timestamp_val):
    if not timestamp_val:
        return ""
    s = str(timestamp_val).strip()
    if s.endswith("Z") or "+" in s:
        return s
    # SQLite CURRENT_TIMESTAMP is "YYYY-MM-DD HH:MM:SS" (in UTC)
    return s.replace(" ", "T") + "Z"

# User DB Helpers
def create_user(username: str, password_hash: str, email: str = None):
    utc_now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, password_hash, email, created_at) VALUES (?, ?, ?, ?)",
            (username.strip(), password_hash, email.strip() if email else None, utc_now)
        )
        return cursor.lastrowid

def get_user_by_username(username: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username.strip(),))
        row = cursor.fetchone()
        if not row:
            return None
        res = dict(row)
        if res.get("created_at"):
            res["created_at"] = _format_iso_utc(res["created_at"])
        return res

def get_user_by_id(user_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        res = dict(row)
        if res.get("created_at"):
            res["created_at"] = _format_iso_utc(res["created_at"])
        return res

# Game DB Helpers
def save_game_session(user_id: int, total_score: float, rounds: list, game_mode: str = "classic"):
    utc_now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO games (user_id, total_score, rounds_count, game_mode, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, round(total_score, 1), len(rounds), game_mode, utc_now)
        )
        game_id = cursor.lastrowid
        
        for idx, r in enumerate(rounds, 1):
            cursor.execute(
                """
                INSERT INTO game_rounds 
                (game_id, round_number, prompt_name, difficulty, score_earned, doodle_image, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    game_id,
                    idx,
                    r.get("prompt"),
                    r.get("difficulty"),
                    round(float(r.get("score", 0)), 1),
                    r.get("doodle_image", ""),
                    utc_now
                )
            )
        return game_id

def get_user_game_history(user_id: int, limit: int = 50):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, total_score, rounds_count, game_mode, created_at
            FROM games
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT ?
        """, (user_id, limit))
        games = [dict(row) for row in cursor.fetchall()]
        
        for g in games:
            if not g.get("game_mode"):
                g["game_mode"] = "classic"
            if g.get("created_at"):
                g["created_at"] = _format_iso_utc(g["created_at"])
            cursor.execute("""
                SELECT round_number, prompt_name, difficulty, score_earned, doodle_image
                FROM game_rounds
                WHERE game_id = ?
                ORDER BY round_number ASC
            """, (g["id"],))
            g["rounds"] = [dict(r) for r in cursor.fetchall()]
            
        return games

def get_user_stats(user_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(id) as total_games,
                COALESCE(MAX(total_score), 0) as high_score,
                COALESCE(AVG(total_score), 0) as avg_score
            FROM games
            WHERE user_id = ?
        """, (user_id,))
        row = cursor.fetchone()
        if not row:
            return {"total_games": 0, "high_score": 0, "avg_score": 0}
        return {
            "total_games": row["total_games"],
            "high_score": round(row["high_score"], 1),
            "avg_score": round(row["avg_score"], 1)
        }

def get_leaderboard(limit: int = 10):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                u.id as user_id,
                u.username,
                MAX(g.total_score) as high_score,
                COUNT(g.id) as games_played,
                MAX(g.created_at) as last_played
            FROM games g
            JOIN users u ON g.user_id = u.id
            GROUP BY u.id
            ORDER BY high_score DESC
            LIMIT ?
        """, (limit,))
        leaderboard = [dict(row) for row in cursor.fetchall()]
        for entry in leaderboard:
            if entry.get("last_played"):
                entry["last_played"] = _format_iso_utc(entry["last_played"])
        return leaderboard
