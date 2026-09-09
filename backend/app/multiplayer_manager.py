import asyncio
import random
import string
import time
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket

from app.model_service import model_service
from app.database import save_game_session

logger = logging.getLogger("doodle.multiplayer")

class Player:
    def __init__(self, user_id: int, username: str, ws: WebSocket, is_host: bool = False):
        self.user_id = user_id
        self.username = username
        self.ws = ws
        self.is_host = is_host
        self.is_ready = is_host  # Host is always ready; non-hosts must toggle ready
        self.total_score = 0.0
        self.current_round_score = 0.0
        self.current_round_doodle = ""
        self.is_finished_round = False
        self.round_scores: Dict[int, float] = {}   # round_num -> score
        self.round_doodles: Dict[int, str] = {}    # round_num -> base64 doodle

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "is_host": self.is_host,
            "is_ready": self.is_ready,
            "total_score": round(self.total_score, 1),
            "current_round_score": round(self.current_round_score, 1),
            "is_finished_round": self.is_finished_round,
            "round_scores": {k: round(v, 1) for k, v in self.round_scores.items()},
            "round_doodles": self.round_doodles,
        }

class Room:
    MAX_PLAYERS = 8

    def __init__(self, code: str, host_user_id: int):
        self.code = code
        self.host_id = host_user_id
        self.status = "lobby"  # 'lobby', 'in_round', 'round_summary', 'game_finished'
        self.players: Dict[int, Player] = {}
        self.current_round = 1
        self.prompts: List[dict] = []
        self.round_end_timestamp = 0.0
        self.round_duration = 50
        self.timer_task: Optional[asyncio.Task] = None

    def to_dict(self):
        current_prompt = None
        if self.prompts and 0 <= (self.current_round - 1) < len(self.prompts):
            current_prompt = self.prompts[self.current_round - 1]

        now = time.time()
        time_left = 0
        if self.status == "in_round" and self.round_end_timestamp > 0:
            time_left = max(0, int(self.round_end_timestamp - now))

        return {
            "code": self.code,
            "host_id": self.host_id,
            "status": self.status,
            "current_round": self.current_round,
            "total_rounds": len(self.prompts) if self.prompts else 4,
            "current_prompt": current_prompt,
            "round_end_timestamp": self.round_end_timestamp,
            "server_time": now,
            "time_left": time_left,
            "players": [p.to_dict() for p in self.players.values()],
        }

class MultiplayerManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}

    def generate_room_code(self) -> str:
        chars = string.ascii_uppercase + "23456789"
        for _ in range(100):
            code = "".join(random.choices(chars, k=6))
            if code not in self.rooms:
                return code
        return f"ROOM{random.randint(10, 99)}"

    def create_room(self, host_user_id: int) -> Room:
        code = self.generate_room_code()
        room = Room(code, host_user_id)
        self.rooms[code] = room
        logger.info(f"Created multiplayer room {code} by user {host_user_id}")
        return room

    def get_room(self, code: str) -> Optional[Room]:
        return self.rooms.get(code.upper().strip())

    async def connect_player(self, code: str, user_id: int, username: str, ws: WebSocket) -> Optional[Room]:
        room = self.get_room(code)
        if not room:
            await ws.send_json({"type": "error", "message": f"Room '{code}' not found."})
            return None

        if len(room.players) >= Room.MAX_PLAYERS and user_id not in room.players:
            await ws.send_json({"type": "error", "message": "Room is full (max 8 players)."})
            return None

        if room.status != "lobby" and user_id not in room.players:
            await ws.send_json({"type": "error", "message": "Game is already in progress in this room."})
            return None

        is_host = (user_id == room.host_id) or (len(room.players) == 0)
        if is_host:
            room.host_id = user_id

        # Add or update player
        player = Player(user_id, username, ws, is_host=is_host)
        if user_id in room.players:
            old = room.players[user_id]
            player.round_scores = old.round_scores
            player.round_doodles = old.round_doodles
            player.total_score = old.total_score
            player.is_ready = old.is_ready

        room.players[user_id] = player
        logger.info(f"User {username} ({user_id}) joined room {code}. Total: {len(room.players)}")

        await self.broadcast_room_state(room)
        return room

    async def toggle_ready(self, code: str, user_id: int):
        room = self.get_room(code)
        if not room or room.status != "lobby":
            return

        player = room.players.get(user_id)
        if not player or player.is_host:
            return  # Host is always ready

        player.is_ready = not player.is_ready
        logger.info(f"User {player.username} in room {code} set ready={player.is_ready}")
        await self.broadcast_room_state(room)

    async def disconnect_player(self, code: str, user_id: int):
        room = self.get_room(code)
        if not room or user_id not in room.players:
            return

        del room.players[user_id]
        logger.info(f"User {user_id} disconnected from room {code}. Remaining: {len(room.players)}")

        if len(room.players) == 0:
            if room.timer_task and not room.timer_task.done():
                room.timer_task.cancel()
            if code in self.rooms:
                del self.rooms[code]
            logger.info(f"Room {code} deleted (all players left)")
        else:
            if room.host_id == user_id:
                next_host = next(iter(room.players.values()))
                next_host.is_host = True
                next_host.is_ready = True
                room.host_id = next_host.user_id

            await self.broadcast_room_state(room)

    async def broadcast(self, room: Room, message: dict):
        disconnected = []
        for uid, p in room.players.items():
            try:
                await p.ws.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to user {uid}: {e}")
                disconnected.append(uid)

        for uid in disconnected:
            await self.disconnect_player(room.code, uid)

    async def broadcast_room_state(self, room: Room):
        msg = {
            "type": "room_state",
            "room": room.to_dict()
        }
        await self.broadcast(room, msg)

    async def start_game(self, code: str, host_id: int):
        room = self.get_room(code)
        if not room:
            return False, "Room not found"
        if room.host_id != host_id:
            return False, "Only the team host can start the game"
        if len(room.players) < 2:
            return False, "Need at least 2 players to start a multiplayer match"

        # Check ready status of all non-hosts
        non_hosts = [p for p in room.players.values() if not p.is_host]
        if not all(p.is_ready for p in non_hosts):
            not_ready_names = [p.username for p in non_hosts if not p.is_ready]
            return False, f"Waiting for players to ready up: {', '.join(not_ready_names)}"

        # Generate 4 prompts: 2 easy, 1 medium, 1 hard
        room.prompts = model_service.get_game_prompts()
        room.current_round = 1
        room.status = "in_round"

        # Reset player scores
        for p in room.players.values():
            p.total_score = 0.0
            p.current_round_score = 0.0
            p.current_round_doodle = ""
            p.is_finished_round = False
            p.round_scores = {}
            p.round_doodles = {}

        await self._start_round(room)
        return True, "Game started"

    async def _start_round(self, room: Room):
        if room.current_round > len(room.prompts):
            await self._finish_game(room)
            return

        current_prompt = room.prompts[room.current_round - 1]
        room.status = "in_round"
        room.round_duration = current_prompt["time_limit"]
        
        # Exact server epoch timestamp for end of round
        room.round_end_timestamp = time.time() + room.round_duration

        for p in room.players.values():
            p.current_round_score = 0.0
            p.current_round_doodle = ""
            p.is_finished_round = False

        await self.broadcast_room_state(room)

        if room.timer_task and not room.timer_task.done():
            room.timer_task.cancel()

        room.timer_task = asyncio.create_task(self._round_timer(room, room.round_duration))

    async def _round_timer(self, room: Room, duration: int):
        try:
            # Sleep until end timestamp
            remaining = room.round_end_timestamp - time.time()
            if remaining > 0:
                await asyncio.sleep(remaining)
            await self._end_round(room)
        except asyncio.CancelledError:
            pass

    async def submit_attempt(self, code: str, user_id: int, score: float, doodle: str):
        room = self.get_room(code)
        if not room or room.status != "in_round":
            return

        player = room.players.get(user_id)
        if not player:
            return

        if score >= player.current_round_score or not player.current_round_doodle:
            player.current_round_score = score
            player.current_round_doodle = doodle

        await self.broadcast(room, {
            "type": "score_update",
            "user_id": user_id,
            "username": player.username,
            "score": round(score, 1),
            "best_round_score": round(player.current_round_score, 1),
            "players": [p.to_dict() for p in room.players.values()]
        })

    async def finish_player_round(self, code: str, user_id: int):
        room = self.get_room(code)
        if not room or room.status != "in_round":
            return

        player = room.players.get(user_id)
        if not player:
            return

        player.is_finished_round = True
        await self.broadcast(room, {
            "type": "player_finished",
            "user_id": user_id,
            "username": player.username,
            "players": [p.to_dict() for p in room.players.values()]
        })

        all_finished = all(p.is_finished_round for p in room.players.values())
        if all_finished:
            if room.timer_task and not room.timer_task.done():
                room.timer_task.cancel()
            await self._end_round(room)

    async def _end_round(self, room: Room):
        room.status = "round_summary"

        for p in room.players.values():
            p.round_scores[room.current_round] = p.current_round_score
            p.round_doodles[room.current_round] = p.current_round_doodle
            p.total_score = sum(p.round_scores.values())

        await self.broadcast(room, {
            "type": "round_ended",
            "round": room.current_round,
            "room": room.to_dict()
        })

        # Wait 4 seconds intermission
        await asyncio.sleep(4)

        room.current_round += 1
        if room.current_round <= len(room.prompts):
            await self._start_round(room)
        else:
            await self._finish_game(room)

    async def _finish_game(self, room: Room):
        room.status = "game_finished"

        sorted_players = sorted(
            room.players.values(),
            key=lambda p: p.total_score,
            reverse=True
        )

        for p in sorted_players:
            try:
                rounds_list = []
                for r_idx in range(1, len(room.prompts) + 1):
                    prompt_info = room.prompts[r_idx - 1]
                    rounds_list.append({
                        "prompt": prompt_info["prompt"],
                        "difficulty": prompt_info["difficulty"],
                        "score": p.round_scores.get(r_idx, 0.0),
                        "doodle_image": p.round_doodles.get(r_idx, "")
                    })
                save_game_session(p.user_id, p.total_score, rounds_list)
            except Exception as e:
                logger.error(f"Error saving multiplayer game for user {p.user_id}: {e}")

        await self.broadcast(room, {
            "type": "game_finished",
            "room": room.to_dict(),
            "leaderboard": [p.to_dict() for p in sorted_players]
        })

    async def reset_to_lobby(self, code: str, host_id: int):
        room = self.get_room(code)
        if not room or room.host_id != host_id:
            return

        room.status = "lobby"
        room.current_round = 1
        room.prompts = []
        room.round_end_timestamp = 0.0

        for p in room.players.values():
            p.total_score = 0.0
            p.current_round_score = 0.0
            p.current_round_doodle = ""
            p.is_finished_round = False
            p.round_scores = {}
            p.round_doodles = {}
            # Non-hosts must ready up again for rematch!
            p.is_ready = p.is_host

        await self.broadcast_room_state(room)

multiplayer_manager = MultiplayerManager()
