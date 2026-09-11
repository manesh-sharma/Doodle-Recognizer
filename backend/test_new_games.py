import asyncio
import json
import websockets
import requests

API_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000"

def test_solo_contexto():
    print("\n=== Testing Solo Contexto API Endpoints ===")
    # 1. Get new target
    r = requests.get(f"{API_URL}/api/game/contexto/target")
    assert r.status_code == 200, f"Failed target: {r.text}"
    data = r.json()
    session_id = data["session_id"]
    category_hint = data["category_hint"]
    print(f"[PASS] Started Contexto session: id={session_id[:8]}..., hint='{category_hint}'")

    # 2. Submit manual guess (e.g., 'apple')
    r_guess = requests.post(f"{API_URL}/api/game/contexto/guess", json={
        "session_id": session_id,
        "manual_guess": "apple"
    })
    assert r_guess.status_code == 200, f"Failed guess: {r_guess.text}"
    guess_data = r_guess.json()
    print(f"[PASS] Guessed 'apple': Rank #{guess_data['rank']} / {guess_data['total_words']} ({guess_data['proximity']}), Sim={guess_data['similarity']}%")
    assert "rank" in guess_data
    assert "similarity" in guess_data
    assert "color" in guess_data

    # 3. Request progressive hints
    h1 = requests.get(f"{API_URL}/api/game/contexto/hint?session_id={session_id}&level=1").json()
    h2 = requests.get(f"{API_URL}/api/game/contexto/hint?session_id={session_id}&level=2").json()
    h3 = requests.get(f"{API_URL}/api/game/contexto/hint?session_id={session_id}&level=3").json()
    print(f"[PASS] Hint 1: {h1['hint']}")
    print(f"[PASS] Hint 2: {h2['hint']}")
    print(f"[PASS] Hint 3: {h3['hint']}")

    # 4. Give up and reveal
    r_giveup = requests.post(f"{API_URL}/api/game/contexto/give_up", json={"session_id": session_id})
    assert r_giveup.status_code == 200
    giveup_data = r_giveup.json()
    secret = giveup_data["secret_word"]
    print(f"[PASS] Revealed secret word on give up: '{secret}'")

    # 5. Now test guessing the exact secret word in a new session
    r2 = requests.get(f"{API_URL}/api/game/contexto/target").json()
    s2_id = r2["session_id"]
    # Get the word via give up on another session or give up s2 to test match
    giveup_s2 = requests.post(f"{API_URL}/api/game/contexto/give_up", json={"session_id": s2_id}).json()
    target_word = giveup_s2["secret_word"]
    
    # In another session, guess the target word directly
    r3 = requests.get(f"{API_URL}/api/game/contexto/target").json()
    s3_id = r3["session_id"]
    # Start fresh session with target
    r_match = requests.post(f"{API_URL}/api/game/contexto/guess", json={
        "session_id": s2_id,
        "manual_guess": target_word
    }).json()
    print(f"[PASS] Exact match test: is_match={r_match['is_match']}, rank={r_match['rank']}")
    assert r_match["is_match"] is True
    assert r_match["rank"] == 1

async def test_multiplayer_imposter_flow():
    print("\n=== Testing Multiplayer Finding Imposter Mode (3 Players) ===")
    
    # 1. Register/Login 3 players
    users = [
        {"username": "imposter_host", "password": "password123"},
        {"username": "imposter_p2", "password": "password123"},
        {"username": "imposter_p3", "password": "password123"},
    ]
    tokens = []
    for u in users:
        r = requests.post(f"{API_URL}/api/auth/register", json=u)
        if r.status_code == 400:
            r = requests.post(f"{API_URL}/api/auth/login", json=u)
        tokens.append(r.json()["access_token"])

    # 2. Host creates room
    headers = {"Authorization": f"Bearer {tokens[0]}"}
    create_res = requests.post(f"{API_URL}/api/multiplayer/create", headers=headers)
    room_code = create_res.json()["room_code"]
    print(f"[PASS] Room created: {room_code}")

    uri = f"{WS_URL}/ws/multiplayer/{room_code}"
    async with websockets.connect(uri) as ws1:
        await ws1.send(json.dumps({"type": "join", "token": tokens[0], "room_code": room_code}))
        msg1 = json.loads(await ws1.recv())

        async with websockets.connect(uri) as ws2:
            await ws2.send(json.dumps({"type": "join", "token": tokens[1], "room_code": room_code}))
            msg2 = json.loads(await ws2.recv())
            _ = await ws1.recv() # broadcast

            async with websockets.connect(uri) as ws3:
                await ws3.send(json.dumps({"type": "join", "token": tokens[2], "room_code": room_code}))
                msg3 = json.loads(await ws3.recv())
                _ = await ws1.recv()
                _ = await ws2.recv()
                print("[PASS] All 3 players connected to lobby!")

                # 3. Host configures Game Mode to 'imposter' with 2 rounds
                await ws1.send(json.dumps({
                    "type": "set_game_settings",
                    "game_mode": "imposter",
                    "total_rounds": 2
                }))
                u_msg1 = json.loads(await ws1.recv())
                u_msg2 = json.loads(await ws2.recv())
                u_msg3 = json.loads(await ws3.recv())
                print(f"[PASS] Settings updated: mode={u_msg1['room']['game_mode']}, rounds={u_msg1['room']['total_rounds']}")
                assert u_msg1["room"]["game_mode"] == "imposter"
                assert u_msg1["room"]["total_rounds"] == 2

                # 4. Non-hosts toggle ready
                await ws2.send(json.dumps({"type": "toggle_ready"}))
                _ = await ws1.recv()
                _ = await ws2.recv()
                _ = await ws3.recv()

                await ws3.send(json.dumps({"type": "toggle_ready"}))
                _ = await ws1.recv()
                _ = await ws2.recv()
                _ = await ws3.recv()
                print("[PASS] Non-hosts are ready!")

                # 5. Host starts Imposter game
                await ws1.send(json.dumps({"type": "start_game"}))
                start1 = json.loads(await ws1.recv())
                start2 = json.loads(await ws2.recv())
                start3 = json.loads(await ws3.recv())

                room_data = start1["room"]
                print(f"[PASS] Imposter game started! Status={room_data['status']}")
                assert room_data["status"] == "imposter_drawing"

                # Check secret prompt privacy: imposter sees '???', innocents see the secret word
                prompts = [
                    start1["room"]["current_prompt"],
                    start2["room"]["current_prompt"],
                    start3["room"]["current_prompt"],
                ]
                imposter_prompts = [p for p in prompts if p.get("is_imposter") is True]
                innocent_prompts = [p for p in prompts if p.get("is_imposter") is False]
                print(f"[PASS] Role assignment: 1 Imposter prompt={imposter_prompts[0]['prompt']}, 2 Innocents prompt={innocent_prompts[0]['prompt']}")
                assert len(imposter_prompts) == 1
                assert imposter_prompts[0]["prompt"] == "???"
                assert len(innocent_prompts) == 2
                assert innocent_prompts[0]["prompt"] != "???"

                # 6. Active player draws 1 stroke
                active_uid = room_data["active_turn_player_id"]
                active_ws = ws1 if active_uid == room_data["players"][0]["user_id"] else (ws2 if active_uid == room_data["players"][1]["user_id"] else ws3)

                # Send stroke with dummy canvas
                await active_ws.send(json.dumps({
                    "type": "imposter_stroke",
                    "composite_canvas": "dummy_stroke_b64"
                }))

                # Both should receive stroke added broadcast
                st_msg1 = json.loads(await ws1.recv())
                _ = json.loads(await ws2.recv())
                _ = json.loads(await ws3.recv())
                print(f"[PASS] Stroke added broadcast: {st_msg1.get('type')}, turns={st_msg1.get('turn_count')}")
                assert st_msg1["type"] == "imposter_stroke_added"

async def main():
    test_solo_contexto()
    await test_multiplayer_imposter_flow()
    print("\n>>> ALL NEW GAME TESTS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    asyncio.run(main())
