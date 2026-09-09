import asyncio
import json
import websockets
import requests

API_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000"

async def test_multiplayer():
    print("=== Testing Multiplayer Flow with Ready Check and Timestamp Sync ===")
    
    # 1. Register/Login two test users
    user1 = {"username": "player_alpha", "password": "password123"}
    user2 = {"username": "player_beta", "password": "password123"}
    
    # User 1
    r1 = requests.post(f"{API_URL}/api/auth/register", json=user1)
    if r1.status_code == 400:
        r1 = requests.post(f"{API_URL}/api/auth/login", json=user1)
    token1 = r1.json()["access_token"]
    u1_name = r1.json()["user"]["username"]
    print(f"[PASS] User 1 logged in: {u1_name}")

    # User 2
    r2 = requests.post(f"{API_URL}/api/auth/register", json=user2)
    if r2.status_code == 400:
        r2 = requests.post(f"{API_URL}/api/auth/login", json=user2)
    token2 = r2.json()["access_token"]
    u2_name = r2.json()["user"]["username"]
    print(f"[PASS] User 2 logged in: {u2_name}")

    # 2. User 1 creates room
    headers1 = {"Authorization": f"Bearer {token1}"}
    create_res = requests.post(f"{API_URL}/api/multiplayer/create", headers=headers1)
    room_code = create_res.json()["room_code"]
    print(f"[PASS] Room created with code: {room_code}")

    # 3. Connect User 1 via WebSocket
    uri = f"{WS_URL}/ws/multiplayer/{room_code}"
    async with websockets.connect(uri) as ws1:
        await ws1.send(json.dumps({"type": "join", "token": token1, "room_code": room_code}))
        msg1 = json.loads(await ws1.recv())
        print(f"[PASS] Player 1 joined room: status={msg1['room']['status']}, players={len(msg1['room']['players'])}")

        # 4. Connect User 2 via WebSocket
        async with websockets.connect(uri) as ws2:
            await ws2.send(json.dumps({"type": "join", "token": token2, "room_code": room_code}))
            msg2 = json.loads(await ws2.recv())
            print(f"[PASS] Player 2 joined room: players in room={len(msg2['room']['players'])}")

            # Read broadcast on ws1
            msg1_update = json.loads(await ws1.recv())

            # 5. Host attempts to start game BEFORE non-host is ready -> should be rejected!
            await ws1.send(json.dumps({"type": "start_game"}))
            err_msg = json.loads(await ws1.recv())
            print(f"[PASS] Host start rejected when player not ready: '{err_msg.get('message')}'")
            assert "Waiting for players to ready up" in err_msg.get("message", "")

            # 6. Player 2 toggles READY!
            print("Player 2 clicking Ready Up...")
            await ws2.send(json.dumps({"type": "toggle_ready"}))
            ready_msg1 = json.loads(await ws1.recv())
            ready_msg2 = json.loads(await ws2.recv())
            p2_status = next(p for p in ready_msg1["room"]["players"] if p["username"] == "player_beta")
            print(f"[PASS] Player 2 is now ready: {p2_status['is_ready']}")
            assert p2_status["is_ready"] is True

            # 7. Host starts game now that all players are ready
            print("Host starting match with all players ready...")
            await ws1.send(json.dumps({"type": "start_game"}))

            # Both should receive game started
            start_msg1 = json.loads(await ws1.recv())
            start_msg2 = json.loads(await ws2.recv())
            prompt1 = start_msg1["room"]["current_prompt"]["prompt"]
            prompt2 = start_msg2["room"]["current_prompt"]["prompt"]
            assert prompt1 == prompt2, "Prompts do not match!"

            # Verify timestamp synchronization fields
            end_ts = start_msg1["room"]["round_end_timestamp"]
            srv_time = start_msg1["room"]["server_time"]
            time_left = start_msg1["room"]["time_left"]
            print(f"[PASS] Timestamp sync verified: end_ts={end_ts:.2f}, server_time={srv_time:.2f}, time_left={time_left}s")
            assert end_ts > srv_time, "End timestamp must be in future"
            assert time_left >= 48, "Time left should be ~50s"

            # 8. Player 1 submits attempt
            await ws1.send(json.dumps({"type": "submit_attempt", "score": 85.5, "doodle": "dummy_b64"}))
            score_msg1 = json.loads(await ws1.recv())
            score_msg2 = json.loads(await ws2.recv())
            print(f"[PASS] Live score broadcast verified: {score_msg2['username']} scored {score_msg2['score']}%")

    print("\n>>> ALL MULTIPLAYER READY & TIMESTAMP TESTS PASSED! <<<")

if __name__ == "__main__":
    asyncio.run(test_multiplayer())
