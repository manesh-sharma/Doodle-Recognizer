from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from app.auth import get_current_user, decode_token
from app.database import get_user_by_id
from app.multiplayer_manager import multiplayer_manager
import json
import logging

logger = logging.getLogger("doodle.multiplayer.routes")

router = APIRouter(prefix="/api/multiplayer", tags=["Multiplayer"])

@router.post("/create")
def create_room(current_user: dict = Depends(get_current_user)):
    room = multiplayer_manager.create_room(current_user["id"])
    return {
        "room_code": room.code,
        "host_id": room.host_id
    }

@router.get("/room/{room_code}")
def check_room(room_code: str):
    room = multiplayer_manager.get_room(room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {
        "code": room.code,
        "player_count": len(room.players),
        "max_players": room.MAX_PLAYERS,
        "status": room.status
    }

# WebSocket Endpoint
ws_router = APIRouter(tags=["Multiplayer WebSocket"])

@ws_router.websocket("/ws/multiplayer/{room_code}")
async def multiplayer_websocket(websocket: WebSocket, room_code: str):
    await websocket.accept()
    code = room_code.upper().strip()
    user = None

    try:
        # First message must be authentication
        initial_data = await websocket.receive_json()
        if initial_data.get("type") != "join" or not initial_data.get("token"):
            await websocket.send_json({"type": "error", "message": "Authentication required to join."})
            await websocket.close()
            return

        token = initial_data["token"]
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
        user = get_user_by_id(user_id)
        if not user:
            await websocket.send_json({"type": "error", "message": "User not found."})
            await websocket.close()
            return

        room = await multiplayer_manager.connect_player(code, user["id"], user["username"], websocket)
        if not room:
            await websocket.close()
            return

        # Main listen loop
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "start_game":
                success, msg = await multiplayer_manager.start_game(code, user["id"])
                if not success:
                    await websocket.send_json({"type": "error", "message": msg})

            elif msg_type == "submit_attempt":
                score = float(data.get("score", 0.0))
                doodle = data.get("doodle", "")
                await multiplayer_manager.submit_attempt(code, user["id"], score, doodle)

            elif msg_type == "finish_round":
                await multiplayer_manager.finish_player_round(code, user["id"])

            elif msg_type == "toggle_ready":
                await multiplayer_manager.toggle_ready(code, user["id"])

            elif msg_type == "set_game_settings":
                game_mode = str(data.get("game_mode", "classic"))
                total_rounds = int(data.get("total_rounds", 3))
                await multiplayer_manager.set_game_settings(code, user["id"], game_mode, total_rounds)

            elif msg_type == "imposter_stroke":
                composite_canvas = data.get("composite_canvas", "")
                await multiplayer_manager.submit_imposter_stroke(code, user["id"], composite_canvas)

            elif msg_type == "imposter_vote":
                suspect_id = int(data.get("suspect_id", 0))
                await multiplayer_manager.submit_imposter_vote(code, user["id"], suspect_id)

            elif msg_type == "contexto_guess":
                doodle = data.get("doodle", "")
                await multiplayer_manager.submit_contexto_guess(code, user["id"], doodle)

            elif msg_type == "play_again":
                await multiplayer_manager.reset_to_lobby(code, user["id"])

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user in room {code}")
        if user:
            await multiplayer_manager.disconnect_player(code, user["id"])
    except Exception as e:
        logger.error(f"WebSocket error in room {code}: {e}")
        if user:
            await multiplayer_manager.disconnect_player(code, user["id"])
