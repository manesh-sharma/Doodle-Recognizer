import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

# Find curated_classes_v4.json
CLASSES_JSON_PATH = os.environ.get(
    "CLASSES_JSON_PATH",
    str(ROOT_DIR / "curated_classes_v4.json")
)
if not os.path.exists(CLASSES_JSON_PATH):
    # Check current directory
    alt_path = str(BASE_DIR / "curated_classes_v4.json")
    if os.path.exists(alt_path):
        CLASSES_JSON_PATH = alt_path

# Find curated_v4_combine_classes.json
COMBINE_CLASSES_JSON_PATH = os.environ.get(
    "COMBINE_CLASSES_JSON_PATH",
    str(ROOT_DIR / "curated_v4_combine_classes.json")
)
if not os.path.exists(COMBINE_CLASSES_JSON_PATH):
    alt_combine = str(BASE_DIR / "curated_v4_combine_classes.json")
    if os.path.exists(alt_combine):
        COMBINE_CLASSES_JSON_PATH = alt_combine

# Find model.keras
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    str(ROOT_DIR / "model.keras")
)
if not os.path.exists(MODEL_PATH):
    alt_model = str(BASE_DIR / "model.keras")
    if os.path.exists(alt_model):
        MODEL_PATH = alt_model

# Database
DB_PATH = os.environ.get("DB_PATH", str(BASE_DIR / "doodle.db"))

# JWT Auth
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-doodle-jwt-key-change-in-prod-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# CORS
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
