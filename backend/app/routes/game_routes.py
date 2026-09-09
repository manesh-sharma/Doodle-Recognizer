from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models import RoundPrompt, SaveGameRequest, GameHistoryItem
from app.model_service import model_service
from app.database import save_game_session, get_user_game_history, get_leaderboard
from app.auth import get_current_user

router = APIRouter(prefix="/api/game", tags=["Game"])

@router.get("/prompts", response_model=List[RoundPrompt])
def get_game_prompts():
    prompts = model_service.get_game_prompts()
    if not prompts:
        raise HTTPException(status_code=500, detail="Unable to load game prompts from class list")
    return prompts

@router.post("/save")
def save_game(payload: SaveGameRequest, current_user: dict = Depends(get_current_user)):
    if not payload.rounds:
        raise HTTPException(status_code=400, detail="No rounds provided to save")
        
    rounds_data = [r.dict() for r in payload.rounds]
    game_id = save_game_session(
        user_id=current_user["id"],
        total_score=payload.total_score,
        rounds=rounds_data
    )
    return {
        "success": True,
        "game_id": game_id,
        "message": "Game session saved successfully"
    }

@router.get("/history", response_model=List[GameHistoryItem])
def get_history(current_user: dict = Depends(get_current_user)):
    history = get_user_game_history(current_user["id"])
    return history

@router.get("/leaderboard")
def get_top_scores():
    return get_leaderboard(limit=10)
