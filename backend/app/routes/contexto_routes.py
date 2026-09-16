import uuid
import time
import logging
from typing import Optional, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.contexto_service import contexto_service
from app.model_service import model_service

logger = logging.getLogger("doodle.contexto.routes")
router = APIRouter(prefix="/api/game/contexto", tags=["Contexto"])

# In-memory store of active solo Contexto sessions
# session_id -> { "target_word": str, "target_id": int, "difficulty": str, "category_hint": str, "created_at": float, "guesses": list }
sessions: Dict[str, dict] = {}

class ContextoGuessRequest(BaseModel):
    session_id: str
    image: Optional[str] = None
    manual_guess: Optional[str] = None

class ContextoGiveUpRequest(BaseModel):
    session_id: str

@router.get("/target")
def get_new_contexto_target(difficulty: Optional[str] = None):
    """
    Starts a new solo Contexto guessing session.
    Hides the secret word from the client, returning only hints and difficulty.
    """
    target = contexto_service.get_random_target(difficulty=difficulty)
    session_id = str(uuid.uuid4())

    sessions[session_id] = {
        "target_word": target["prompt"],
        "target_id": target["target_id"],
        "difficulty": target["difficulty"],
        "category_hint": target["category_hint"],
        "semantic_clue": target["semantic_clue"],
        "created_at": time.time(),
        "guesses": []
    }

    # Clean up old sessions (> 2 hours)
    now = time.time()
    stale_keys = [k for k, v in sessions.items() if now - v.get("created_at", 0) > 7200]
    for k in stale_keys:
        sessions.pop(k, None)

    return {
        "session_id": session_id,
        "difficulty": target["difficulty"],
        "category_hint": target["category_hint"],
        "total_words": len(contexto_service.get_all_active_words())
    }

@router.post("/guess")
def submit_contexto_guess(payload: ContextoGuessRequest):
    """
    Evaluates a doodle sketch against the secret Contexto target word.
    Uses model prediction to recognize what was drawn, then computes semantic proximity.
    """
    session = sessions.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session expired or not found. Please start a new game.")

    target_word = session["target_word"]
    guessed_word = None
    confidence = 0.0
    predictions = []

    if payload.image:
        result = model_service.predict(payload.image, target_class_name=target_word)
        predictions = result.get("predictions", [])
        if not predictions:
            raise HTTPException(status_code=400, detail="Canvas was empty or doodle could not be recognized.")
        
        guessed_word = predictions[0]["class_name"]
        confidence = predictions[0]["confidence"]
        
        # Check if direct target confidence was very high
        target_conf = result.get("target_confidence", 0.0)
        if target_conf >= 65.0:
            guessed_word = target_word
            confidence = target_conf

    elif payload.manual_guess:
        guessed_word = payload.manual_guess.strip().lower()
        confidence = 100.0
    else:
        raise HTTPException(status_code=400, detail="Must provide either drawing image or manual guess.")

    eval_result = contexto_service.evaluate_guess(target_word, guessed_word)
    session["guesses"].append({
        "guessed_word": guessed_word,
        "confidence": confidence,
        "rank": eval_result["rank"],
        "similarity": eval_result["similarity"],
        "proximity": eval_result["proximity"],
        "timestamp": time.time()
    })

    response = {
        "guessed_word": guessed_word,
        "confidence": round(confidence, 1),
        "rank": eval_result["rank"],
        "total_words": eval_result["total_words"],
        "similarity": eval_result["similarity"],
        "proximity": eval_result["proximity"],
        "color": eval_result["color"],
        "is_match": eval_result["is_match"],
        "guess_count": len(session["guesses"]),
        "secret_word": target_word if eval_result["is_match"] else None,
        "top_predictions": predictions[:3]
    }

    return response

@router.get("/hint")
def get_contexto_hint(session_id: str, level: int = 1):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    target_word = session["target_word"]
    hint_data = contexto_service.get_hint(target_word, level=level)
    return hint_data

@router.post("/give_up")
def give_up_contexto(payload: ContextoGiveUpRequest):
    session = sessions.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "secret_word": session["target_word"],
        "category": session["category_hint"],
        "clue": session["semantic_clue"],
        "guesses_count": len(session["guesses"])
    }
