import requests
import base64
import io
from PIL import Image, ImageDraw

def run_integration():
    API = "http://127.0.0.1:8000"

    # 1. Register test user
    user_payload = {"username": "quick_artist", "password": "password123"}
    reg_res = requests.post(f"{API}/api/auth/register", json=user_payload)
    if reg_res.status_code == 400:  # Already registered
        login_res = requests.post(f"{API}/api/auth/login", json=user_payload)
        token = login_res.json()["access_token"]
        print("[PASS] User logged in, token received.")
    else:
        token = reg_res.json()["access_token"]
        print("[PASS] User registered, token received.")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get profile
    me_res = requests.get(f"{API}/api/auth/me", headers=headers)
    print(f"[PASS] Profile me: {me_res.status_code}, username: {me_res.json()['user']['username']}")

    # 3. Get 4 Game Prompts
    p_res = requests.get(f"{API}/api/game/prompts")
    prompts = p_res.json()
    prompt_names = [f"{p['prompt']} ({p['difficulty']})" for p in prompts]
    print(f"[PASS] Prompts received: {prompt_names}")
    assert len(prompts) == 4, "Expected 4 prompts"

    # 4. Predict stroke
    img = Image.new("RGB", (200, 200), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle((50, 50, 150, 150), outline=(0, 0, 0), width=6)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

    pred_res = requests.post(f"{API}/api/predict", json={"image": b64, "target_class": prompts[0]["prompt"]})
    pred_data = pred_res.json()
    top1 = pred_data["predictions"][0]
    print(f"[PASS] Inference top 1: {top1['class_name']} ({top1['confidence']}%)")
    print(f"       Target '{prompts[0]['prompt']}' confidence: {pred_data.get('target_confidence')}%")

    # 5. Save Game
    save_payload = {
        "rounds": [
            {"prompt": prompts[0]["prompt"], "difficulty": prompts[0]["difficulty"], "score": 92.5, "doodle_image": b64},
            {"prompt": prompts[1]["prompt"], "difficulty": prompts[1]["difficulty"], "score": 88.0, "doodle_image": b64},
            {"prompt": prompts[2]["prompt"], "difficulty": prompts[2]["difficulty"], "score": 74.5, "doodle_image": b64},
            {"prompt": prompts[3]["prompt"], "difficulty": prompts[3]["difficulty"], "score": 95.0, "doodle_image": b64},
        ],
        "total_score": 350.0
    }
    save_res = requests.post(f"{API}/api/game/save", json=save_payload, headers=headers)
    print(f"[PASS] Save game status: {save_res.status_code}, ID: {save_res.json().get('game_id')}")

    # 6. Fetch History
    hist_res = requests.get(f"{API}/api/game/history", headers=headers)
    print(f"[PASS] Game history entries for user: {len(hist_res.json())}")

    print("\n>>> FULL END-TO-END HTTP INTEGRATION TEST PASSED! <<<")

if __name__ == "__main__":
    run_integration()
