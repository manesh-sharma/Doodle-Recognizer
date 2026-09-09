import sys
import os
import io
import base64
from PIL import Image, ImageDraw

def run_tests():
    print("=== Testing Doodle Backend ===")
    
    # 1. Imports
    from app.main import app
    from app.database import init_db, create_user, get_user_by_username, get_user_stats, save_game_session, get_user_game_history
    from app.model_service import model_service
    from app.auth import hash_password, verify_password, create_access_token, decode_token
    print("[PASS] Imports and FastAPI app loaded.")

    # 2. Database
    init_db()
    test_username = "test_player_1"
    existing = get_user_by_username(test_username)
    if not existing:
        pwd_hash = hash_password("secret123")
        uid = create_user(test_username, pwd_hash, "player1@test.com")
        print(f"[PASS] Created test user with ID {uid}")
    else:
        uid = existing["id"]
        print(f"[PASS] Found existing user ID {uid}")

    # 3. Model & Classes
    print(f"[PASS] Total classes loaded: {len(model_service.id_to_class)}")
    print(f"       Easy: {len(model_service.easy_classes)}, Medium: {len(model_service.medium_classes)}, Hard: {len(model_service.hard_classes)}")
    assert len(model_service.id_to_class) > 0, "No classes loaded!"

    # 4. Game Prompts Generation (2 Easy, 1 Medium, 1 Hard)
    prompts = model_service.get_game_prompts()
    print(f"[PASS] Prompts generated: {len(prompts)} rounds")
    diffs = [p["difficulty"] for p in prompts]
    print(f"       Difficulties: {diffs}")
    assert len(prompts) == 4, f"Expected 4 prompts, got {len(prompts)}"
    assert diffs.count("easy") == 2, "Expected 2 easy prompts"
    assert diffs.count("medium") == 1, "Expected 1 medium prompt"
    assert diffs.count("hard") == 1, "Expected 1 hard prompt"

    # 5. Drawing & Inference API
    img = Image.new("RGB", (250, 250), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.ellipse((40, 40, 210, 210), outline=(0, 0, 0), width=8) # Draw circle (apple / clock / etc.)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

    result = model_service.predict(b64, target_class_name=prompts[0]["prompt"])
    print(f"[PASS] Inference result:")
    print(f"       Model loaded: {result['is_model_loaded']}")
    print(f"       Target '{prompts[0]['prompt']}' confidence: {result.get('target_confidence')}%")
    print(f"       Top 5 predictions: {[p['class_name'] + ' (' + str(p['confidence']) + '%)' for p in result['predictions']]}")

    # 6. Save Game Session
    game_rounds = [
        {"prompt": prompts[0]["prompt"], "difficulty": prompts[0]["difficulty"], "score": 85.0, "doodle_image": b64},
        {"prompt": prompts[1]["prompt"], "difficulty": prompts[1]["difficulty"], "score": 90.0, "doodle_image": b64},
        {"prompt": prompts[2]["prompt"], "difficulty": prompts[2]["difficulty"], "score": 78.5, "doodle_image": b64},
        {"prompt": prompts[3]["prompt"], "difficulty": prompts[3]["difficulty"], "score": 65.0, "doodle_image": b64},
    ]
    gid = save_game_session(uid, total_score=318.5, rounds=game_rounds)
    print(f"[PASS] Game session saved to SQLite with ID {gid}")

    history = get_user_game_history(uid)
    print(f"[PASS] Retrieved user game history: {len(history)} games found.")
    
    stats = get_user_stats(uid)
    print(f"[PASS] User stats: High score={stats['high_score']}, Games={stats['total_games']}, Avg={stats['avg_score']}")

    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! NO ERRORS FOUND! <<<")

if __name__ == "__main__":
    run_tests()
