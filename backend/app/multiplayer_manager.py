import asyncio
import random
import string
import time
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket

from app.model_service import model_service
from app.contexto_service import contexto_service
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

        # Imposter / Contexto extra fields
        self.is_imposter = False
        self.has_voted = False
        self.vote_target: Optional[int] = None
        self.contexto_best_rank = 999
        self.strokes_drawn_in_round = 0

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
            "has_voted": self.has_voted,
            "contexto_best_rank": self.contexto_best_rank,
            "strokes_drawn": self.strokes_drawn_in_round,
        }

class Room:
    MAX_PLAYERS = 8

    def __init__(self, code: str, host_user_id: int):
        self.code = code
        self.host_id = host_user_id
        self.status = "lobby"  # 'lobby', 'in_round', 'round_summary', 'game_finished', 'imposter_drawing', 'imposter_voting', 'imposter_reveal', 'contexto_race', 'contexto_summary'
        self.game_mode = "classic"  # 'classic', 'imposter', 'contexto'
        self.total_rounds = 4
        self.players: Dict[int, Player] = {}
        self.current_round = 1
        self.prompts: List[dict] = []
        self.round_end_timestamp = 0.0
        self.round_duration = 50
        self.timer_task: Optional[asyncio.Task] = None
        self.turn_timer_task: Optional[asyncio.Task] = None

        # Imposter Mode Fields
        self.secret_word = ""
        self.imposter_id: Optional[int] = None
        self.turn_order: List[int] = []
        self.active_turn_player_id: Optional[int] = None
        self.turn_end_timestamp = 0.0
        self.turn_duration = 25
        self.turn_count = 0
        self.current_stroke_round = 1
        self.max_stroke_rounds = 2
        self.composite_canvas = ""
        self.top_prediction: Optional[dict] = None
        self.target_confidence = 0.0
        self.votes: Dict[int, int] = {}  # voter_id -> suspect_id
        self.voting_end_timestamp = 0.0
        self.round_result: Optional[dict] = None

        # Contexto Mode Fields
        self.contexto_winner: Optional[dict] = None
        self.contexto_guesses: Dict[int, list] = {}

    def to_dict_for_user(self, user_id: int):
        now = time.time()
        time_left = 0
        if self.status in ("in_round", "imposter_drawing", "contexto_race") and self.round_end_timestamp > 0:
            time_left = max(0, int(self.round_end_timestamp - now))
        elif self.status == "imposter_voting" and self.voting_end_timestamp > 0:
            time_left = max(0, int(self.voting_end_timestamp - now))

        turn_time_left = 0
        if self.status == "imposter_drawing" and self.turn_end_timestamp > 0:
            turn_time_left = max(0, int(self.turn_end_timestamp - now))

        # Handle Prompts & Secret Role Display
        current_prompt = None
        is_imposter = False

        if self.game_mode == "classic":
            if self.prompts and 0 <= (self.current_round - 1) < len(self.prompts):
                current_prompt = self.prompts[self.current_round - 1]
        elif self.game_mode == "imposter":
            is_imposter = (user_id == self.imposter_id)
            if self.status in ("imposter_reveal", "game_finished"):
                current_prompt = {
                    "prompt": self.secret_word,
                    "is_imposter": is_imposter,
                    "imposter_id": self.imposter_id
                }
            elif is_imposter:
                current_prompt = {
                    "prompt": "???",
                    "is_imposter": True,
                    "role": "imposter",
                    "hint": "You are the IMPOSTER! Fake it, blend in, and don't get caught!"
                }
            else:
                current_prompt = {
                    "prompt": self.secret_word,
                    "is_imposter": False,
                    "role": "innocent",
                    "hint": "Draw 1 stroke when it's your turn. Identify the imposter!"
                }
        elif self.game_mode == "contexto":
            if self.status in ("contexto_summary", "game_finished"):
                current_prompt = {"prompt": self.secret_word}
            else:
                current_prompt = {
                    "prompt": "???",
                    "hint": "Draw guesses to find the secret word! First to Rank #1 wins."
                }

        # Active player username
        active_username = ""
        if self.active_turn_player_id and self.active_turn_player_id in self.players:
            active_username = self.players[self.active_turn_player_id].username

        return {
            "code": self.code,
            "host_id": self.host_id,
            "status": self.status,
            "game_mode": self.game_mode,
            "current_round": self.current_round,
            "total_rounds": self.total_rounds,
            "current_prompt": current_prompt,
            "round_end_timestamp": self.round_end_timestamp,
            "turn_end_timestamp": self.turn_end_timestamp,
            "turn_time_left": turn_time_left,
            "active_turn_player_id": self.active_turn_player_id,
            "active_turn_username": active_username,
            "composite_canvas": self.composite_canvas,
            "top_prediction": self.top_prediction,
            "target_confidence": self.target_confidence,
            "turn_count": self.turn_count,
            "current_stroke_round": self.current_stroke_round,
            "max_stroke_rounds": self.max_stroke_rounds,
            "votes_count": len(self.votes),
            "round_result": self.round_result,
            "contexto_winner": self.contexto_winner,
            "server_time": now,
            "time_left": time_left,
            "players": [p.to_dict() for p in self.players.values()],
        }

    def to_dict(self):
        # Default representation
        return self.to_dict_for_user(self.host_id)

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
            return

        player.is_ready = not player.is_ready
        logger.info(f"User {player.username} in room {code} set ready={player.is_ready}")
        await self.broadcast_room_state(room)

    async def set_game_settings(self, code: str, host_id: int, game_mode: str, total_rounds: int):
        room = self.get_room(code)
        if not room or room.host_id != host_id or room.status != "lobby":
            return

        if game_mode in ("classic", "imposter", "contexto"):
            room.game_mode = game_mode
        
        rounds = max(1, min(5, int(total_rounds)))
        room.total_rounds = rounds

        logger.info(f"Room {code} settings updated: mode={room.game_mode}, rounds={room.total_rounds}")
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
            if room.turn_timer_task and not room.turn_timer_task.done():
                room.turn_timer_task.cancel()
            if code in self.rooms:
                del self.rooms[code]
            logger.info(f"Room {code} deleted (all players left)")
        else:
            if room.host_id == user_id:
                next_host = next(iter(room.players.values()))
                next_host.is_host = True
                next_host.is_ready = True
                room.host_id = next_host.user_id

            # If it was active player's turn in imposter mode, advance turn
            if room.status == "imposter_drawing" and room.active_turn_player_id == user_id:
                await self._advance_imposter_turn(room)

            await self.broadcast_room_state(room)

    async def broadcast(self, room: Room, message: dict):
        disconnected = []
        for uid, p in list(room.players.items()):
            try:
                await p.ws.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to user {uid}: {e}")
                disconnected.append(uid)

        for uid in disconnected:
            await self.disconnect_player(room.code, uid)

    async def broadcast_room_state(self, room: Room):
        disconnected = []
        for uid, p in list(room.players.items()):
            try:
                msg = {
                    "type": "room_state",
                    "room": room.to_dict_for_user(uid)
                }
                await p.ws.send_json(msg)
            except Exception as e:
                logger.warning(f"Failed to send room state to user {uid}: {e}")
                disconnected.append(uid)

        for uid in disconnected:
            await self.disconnect_player(room.code, uid)

    # ------------------- GAME START & ROUND CONTROL -------------------

    async def start_game(self, code: str, host_id: int):
        room = self.get_room(code)
        if not room:
            return False, "Room not found"
        if room.host_id != host_id:
            return False, "Only the team host can start the game"

        # Validate minimum player count according to game mode
        if room.game_mode == "imposter":
            if len(room.players) < 3:
                return False, "Finding Imposter requires at least 3 players (1 Imposter and 2+ Innocents)"
        else:
            if len(room.players) < 2:
                return False, "Need at least 2 players to start a match"

        # Check ready status of all non-hosts
        non_hosts = [p for p in room.players.values() if not p.is_host]
        if not all(p.is_ready for p in non_hosts):
            not_ready_names = [p.username for p in non_hosts if not p.is_ready]
            return False, f"Waiting for players to ready up: {', '.join(not_ready_names)}"

        # Reset player scores
        for p in room.players.values():
            p.total_score = 0.0
            p.current_round_score = 0.0
            p.current_round_doodle = ""
            p.is_finished_round = False
            p.round_scores = {}
            p.round_doodles = {}
            p.contexto_best_rank = 999

        room.current_round = 1

        if room.game_mode == "classic":
            # Generate prompts: 2 easy, 1 medium, 1 hard (or up to total_rounds)
            all_prompts = model_service.get_game_prompts()
            room.prompts = all_prompts[:room.total_rounds]
            await self._start_round(room)
        elif room.game_mode == "imposter":
            await self._start_imposter_round(room)
        elif room.game_mode == "contexto":
            await self._start_contexto_round(room)

        return True, "Game started"

    # ==================== 1. CLASSIC 4-ROUND MODE ====================

    async def _start_round(self, room: Room):
        if room.current_round > len(room.prompts):
            await self._finish_game(room)
            return

        current_prompt = room.prompts[room.current_round - 1]
        room.status = "in_round"
        room.round_duration = current_prompt.get("time_limit", 50)
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

        await asyncio.sleep(4)

        room.current_round += 1
        if room.current_round <= len(room.prompts):
            await self._start_round(room)
        else:
            await self._finish_game(room)

    # ==================== 2. FINDING IMPOSTER MODE ====================

    async def _start_imposter_round(self, room: Room):
        if room.current_round > room.total_rounds:
            await self._finish_game(room)
            return

        # Pick random secret word from easy / medium classes
        easy_or_med = model_service.easy_classes + model_service.medium_classes
        chosen_class = random.choice(easy_or_med) if easy_or_med else {"class_name": "apple", "id": 1}
        room.secret_word = chosen_class["class_name"]

        # Pick 1 random player as imposter
        player_ids = list(room.players.keys())
        room.imposter_id = random.choice(player_ids)

        # Shuffle turn order for drawing
        random.shuffle(player_ids)
        room.turn_order = player_ids
        room.active_turn_player_id = room.turn_order[0]
        room.turn_count = 0
        room.current_stroke_round = 1
        room.max_stroke_rounds = 2  # Each player gets 2 turns of 1 stroke
        room.composite_canvas = ""
        room.top_prediction = None
        room.target_confidence = 0.0
        room.votes = {}
        room.round_result = None
        room.status = "imposter_drawing"

        for p in room.players.values():
            p.is_imposter = (p.user_id == room.imposter_id)
            p.has_voted = False
            p.vote_target = None
            p.strokes_drawn_in_round = 0

        logger.info(f"Room {room.code} starting Imposter Round {room.current_round}: Secret='{room.secret_word}', ImposterID={room.imposter_id}")

        await self.broadcast_room_state(room)
        await self._start_imposter_turn_timer(room)

    async def _start_imposter_turn_timer(self, room: Room):
        if room.turn_timer_task and not room.turn_timer_task.done():
            room.turn_timer_task.cancel()

        room.turn_end_timestamp = time.time() + room.turn_duration
        room.turn_timer_task = asyncio.create_task(self._imposter_turn_timeout(room, room.turn_duration))

    async def _imposter_turn_timeout(self, room: Room, duration: int):
        try:
            await asyncio.sleep(duration)
            logger.info(f"Room {room.code}: Turn timeout for user {room.active_turn_player_id}. Passing turn.")
            await self._advance_imposter_turn(room)
        except asyncio.CancelledError:
            pass

    async def submit_imposter_stroke(self, code: str, user_id: int, composite_canvas: str):
        room = self.get_room(code)
        if not room or room.status != "imposter_drawing":
            return

        if room.active_turn_player_id != user_id:
            logger.warning(f"User {user_id} tried to draw out of turn in room {code}")
            return

        if room.turn_timer_task and not room.turn_timer_task.done():
            room.turn_timer_task.cancel()

        player = room.players.get(user_id)
        if player:
            player.strokes_drawn_in_round += 1

        room.composite_canvas = composite_canvas
        room.turn_count += 1

        # Run AI model prediction on the new composite canvas
        try:
            pred_res = model_service.predict(composite_canvas, target_class_name=room.secret_word)
            predictions = pred_res.get("predictions", [])
            target_conf = pred_res.get("target_confidence", 0.0)

            if predictions:
                top_p = predictions[0]
                room.top_prediction = {
                    "class_name": top_p["class_name"],
                    "confidence": top_p["confidence"]
                }
            else:
                room.top_prediction = {"class_name": "In Progress", "confidence": 0.0}

            room.target_confidence = target_conf
        except Exception as e:
            logger.error(f"Error predicting imposter canvas: {e}")

        # Broadcast live stroke update to all players
        await self.broadcast(room, {
            "type": "imposter_stroke_added",
            "drawer_id": user_id,
            "drawer_username": player.username if player else "Unknown",
            "composite_canvas": room.composite_canvas,
            "top_prediction": room.top_prediction,
            "target_confidence": room.target_confidence,
            "turn_count": room.turn_count
        })

        # CHECK EARLY FINISH CONDITION:
        # If target word recognized with 75%+ confidence, drawing stops immediately and voting begins!
        if room.target_confidence >= 75.0:
            logger.info(f"Room {room.code}: 75%+ accuracy reached ({room.target_confidence}%)! Transitioning to voting.")
            await self._start_imposter_voting(room, reason="accuracy_reached")
            return

        # Otherwise advance to next player
        await self._advance_imposter_turn(room)

    async def _advance_imposter_turn(self, room: Room):
        if not room.turn_order:
            await self._start_imposter_voting(room, reason="no_players")
            return

        current_idx = 0
        if room.active_turn_player_id in room.turn_order:
            current_idx = room.turn_order.index(room.active_turn_player_id)

        next_idx = (current_idx + 1) % len(room.turn_order)

        # If looped back to beginning, increment stroke round
        if next_idx == 0:
            room.current_stroke_round += 1
            if room.current_stroke_round > room.max_stroke_rounds:
                # All players have drawn their allocated strokes!
                logger.info(f"Room {room.code}: Max stroke rounds ({room.max_stroke_rounds}) reached. Transitioning to voting.")
                await self._start_imposter_voting(room, reason="turns_complete")
                return

        room.active_turn_player_id = room.turn_order[next_idx]
        await self.broadcast_room_state(room)
        await self._start_imposter_turn_timer(room)

    async def _start_imposter_voting(self, room: Room, reason: str = "turns_complete"):
        if room.turn_timer_task and not room.turn_timer_task.done():
            room.turn_timer_task.cancel()

        room.status = "imposter_voting"
        room.votes = {}
        room.voting_end_timestamp = time.time() + 30.0

        for p in room.players.values():
            p.has_voted = False
            p.vote_target = None

        await self.broadcast(room, {
            "type": "imposter_voting_started",
            "reason": reason,
            "target_confidence": room.target_confidence,
            "top_prediction": room.top_prediction,
            "voting_duration": 30
        })
        await self.broadcast_room_state(room)

        if room.timer_task and not room.timer_task.done():
            room.timer_task.cancel()

        room.timer_task = asyncio.create_task(self._imposter_voting_timer(room, 30))

    async def _imposter_voting_timer(self, room: Room, duration: int):
        try:
            await asyncio.sleep(duration)
            await self._end_imposter_voting(room)
        except asyncio.CancelledError:
            pass

    async def submit_imposter_vote(self, code: str, voter_id: int, suspect_id: int):
        room = self.get_room(code)
        if not room or room.status != "imposter_voting":
            return

        voter = room.players.get(voter_id)
        if not voter:
            return

        room.votes[voter_id] = suspect_id
        voter.has_voted = True
        voter.vote_target = suspect_id

        await self.broadcast(room, {
            "type": "imposter_vote_cast",
            "voter_id": voter_id,
            "votes_count": len(room.votes),
            "total_voters": len(room.players)
        })

        # If all connected players have voted, end voting early
        if len(room.votes) >= len(room.players):
            if room.timer_task and not room.timer_task.done():
                room.timer_task.cancel()
            await self._end_imposter_voting(room)

    async def _end_imposter_voting(self, room: Room):
        room.status = "imposter_reveal"

        # Tally votes
        vote_counts: Dict[int, int] = {}
        for suspect in room.votes.values():
            vote_counts[suspect] = vote_counts.get(suspect, 0) + 1

        # Determine accused player
        accused_id = None
        max_v = -1
        is_tie = False

        for pid, v_cnt in vote_counts.items():
            if v_cnt > max_v:
                max_v = v_cnt
                accused_id = pid
                is_tie = False
            elif v_cnt == max_v:
                is_tie = True

        imposter_caught = (not is_tie) and (accused_id == room.imposter_id)

        imposter_player = room.players.get(room.imposter_id)
        accused_player = room.players.get(accused_id) if accused_id else None

        round_points: Dict[int, float] = {}

        if imposter_caught:
            outcome = "innocents_win"
            # Innocents win! Each innocent gets 100 pts
            for pid, p in room.players.items():
                if pid != room.imposter_id:
                    p.total_score += 100.0
                    p.round_scores[room.current_round] = 100.0
                    round_points[pid] = 100.0
                else:
                    p.round_scores[room.current_round] = 0.0
                    round_points[pid] = 0.0
        else:
            outcome = "imposter_wins"
            # Imposter fooled everyone! Imposter gets 150 pts
            for pid, p in room.players.items():
                if pid == room.imposter_id:
                    p.total_score += 150.0
                    p.round_scores[room.current_round] = 150.0
                    round_points[pid] = 150.0
                else:
                    p.round_scores[room.current_round] = 0.0
                    round_points[pid] = 0.0

        # Save composite doodle for the round
        for p in room.players.values():
            p.round_doodles[room.current_round] = room.composite_canvas

        room.round_result = {
            "outcome": outcome,
            "secret_word": room.secret_word,
            "imposter_id": room.imposter_id,
            "imposter_username": imposter_player.username if imposter_player else "Unknown",
            "accused_id": accused_id,
            "accused_username": accused_player.username if accused_player else "Nobody (Tie)",
            "is_tie": is_tie,
            "vote_counts": {str(k): v for k, v in vote_counts.items()},
            "round_points": {str(k): v for k, v in round_points.items()}
        }

        logger.info(f"Room {room.code} Imposter Round {room.current_round} result: {outcome}, imposter={room.imposter_id}, accused={accused_id}")

        await self.broadcast(room, {
            "type": "imposter_round_reveal",
            "result": room.round_result,
            "players": [p.to_dict() for p in room.players.values()]
        })

        await self.broadcast_room_state(room)

        # 6 seconds intermission to view reveal
        await asyncio.sleep(6)

        room.current_round += 1
        if room.current_round <= room.total_rounds:
            await self._start_imposter_round(room)
        else:
            await self._finish_game(room)

    # ==================== 3. CONTEXTO WORD RACE MODE ====================

    async def _start_contexto_round(self, room: Room):
        if room.current_round > room.total_rounds:
            await self._finish_game(room)
            return

        target_obj = contexto_service.get_random_target()
        room.secret_word = target_obj["prompt"]
        room.status = "contexto_race"
        room.round_duration = 90
        room.round_end_timestamp = time.time() + room.round_duration
        room.contexto_winner = None
        room.contexto_guesses = {}

        for p in room.players.values():
            p.current_round_score = 0.0
            p.current_round_doodle = ""
            p.is_finished_round = False
            p.contexto_best_rank = 999
            room.contexto_guesses[p.user_id] = []

        logger.info(f"Room {room.code} starting Contexto Round {room.current_round}: Secret='{room.secret_word}'")

        await self.broadcast_room_state(room)

        if room.timer_task and not room.timer_task.done():
            room.timer_task.cancel()

        room.timer_task = asyncio.create_task(self._contexto_timer(room, room.round_duration))

    async def _contexto_timer(self, room: Room, duration: int):
        try:
            remaining = room.round_end_timestamp - time.time()
            if remaining > 0:
                await asyncio.sleep(remaining)
            await self._end_contexto_round(room, winner_player=None)
        except asyncio.CancelledError:
            pass

    async def submit_contexto_guess(self, code: str, user_id: int, doodle_b64: str):
        room = self.get_room(code)
        if not room or room.status != "contexto_race":
            return

        player = room.players.get(user_id)
        if not player:
            return

        try:
            pred_res = model_service.predict(doodle_b64, target_class_name=room.secret_word)
            predictions = pred_res.get("predictions", [])
            target_conf = pred_res.get("target_confidence", 0.0)

            if not predictions:
                return

            guessed_class = predictions[0]["class_name"]

            # If model strongly recognized target word
            if target_conf >= 65.0:
                guessed_class = room.secret_word

            eval_res = contexto_service.evaluate_guess(room.secret_word, guessed_class)
            rank = eval_res["rank"]
            is_match = eval_res["is_match"]

            if rank < player.contexto_best_rank:
                player.contexto_best_rank = rank

            player.current_round_doodle = doodle_b64

            # Broadcast guess event without spoiling the secret word!
            await self.broadcast(room, {
                "type": "contexto_feed_update",
                "user_id": user_id,
                "username": player.username,
                "rank": rank,
                "proximity": eval_res["proximity"],
                "color": eval_res["color"],
                "is_match": is_match,
                "best_rank": player.contexto_best_rank
            })

            # FIRST PLAYER TO GUESS THE SECRET WORD WINS THE ROUND!
            if is_match:
                logger.info(f"Room {room.code}: Player {player.username} guessed the secret word '{room.secret_word}'!")
                if room.timer_task and not room.timer_task.done():
                    room.timer_task.cancel()
                await self._end_contexto_round(room, winner_player=player)

        except Exception as e:
            logger.error(f"Contexto guess evaluation error: {e}")

    async def _end_contexto_round(self, room: Room, winner_player: Optional[Player]):
        room.status = "contexto_summary"

        if winner_player:
            winner_player.total_score += 100.0
            winner_player.round_scores[room.current_round] = 100.0
            winner_player.current_round_score = 100.0
            room.contexto_winner = {
                "user_id": winner_player.user_id,
                "username": winner_player.username,
                "secret_word": room.secret_word
            }
        else:
            room.contexto_winner = {
                "user_id": None,
                "username": "Time Expired!",
                "secret_word": room.secret_word
            }

        for p in room.players.values():
            if p.user_id != (winner_player.user_id if winner_player else None):
                p.round_scores[room.current_round] = 0.0

        await self.broadcast(room, {
            "type": "contexto_round_ended",
            "winner": room.contexto_winner,
            "secret_word": room.secret_word,
            "players": [p.to_dict() for p in room.players.values()]
        })

        await self.broadcast_room_state(room)

        # 5 seconds intermission
        await asyncio.sleep(5)

        room.current_round += 1
        if room.current_round <= room.total_rounds:
            await self._start_contexto_round(room)
        else:
            await self._finish_game(room)

    # ==================== COMMON FINISH & RESET ====================

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
                for r_idx in range(1, room.current_round):
                    prompt_title = (
                        room.prompts[r_idx - 1]["prompt"]
                        if room.game_mode == "classic" and r_idx <= len(room.prompts)
                        else f"Round {r_idx}"
                    )
                    rounds_list.append({
                        "prompt": prompt_title,
                        "difficulty": "medium",
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
        room.composite_canvas = ""
        room.top_prediction = None
        room.target_confidence = 0.0
        room.votes = {}
        room.round_result = None
        room.contexto_winner = None

        if room.timer_task and not room.timer_task.done():
            room.timer_task.cancel()
        if room.turn_timer_task and not room.turn_timer_task.done():
            room.turn_timer_task.cancel()

        for p in room.players.values():
            p.total_score = 0.0
            p.current_round_score = 0.0
            p.current_round_doodle = ""
            p.is_finished_round = False
            p.round_scores = {}
            p.round_doodles = {}
            p.is_ready = p.is_host
            p.is_imposter = False
            p.has_voted = False
            p.vote_target = None
            p.contexto_best_rank = 999
            p.strokes_drawn_in_round = 0

        await self.broadcast_room_state(room)

multiplayer_manager = MultiplayerManager()
