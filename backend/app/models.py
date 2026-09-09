from pydantic import BaseModel, Field
from typing import List, Optional

# Auth Schemas
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=4)
    email: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

# Prediction Schemas
class PredictRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded data URI or raw image bytes")
    target_class: Optional[str] = None

class PredictionItem(BaseModel):
    id: int
    class_name: str
    label: str
    confidence: float

class PredictResponse(BaseModel):
    predictions: List[PredictionItem]
    target_confidence: Optional[float] = 0.0
    is_model_loaded: bool
    has_drawing: bool
    model_source: Optional[str] = None
    message: Optional[str] = None

# Game Schemas
class RoundPrompt(BaseModel):
    id: int
    prompt: str
    difficulty: str
    time_limit: int
    hint: Optional[str] = None

class GameRoundRecord(BaseModel):
    prompt: str
    difficulty: str
    score: float
    doodle_image: Optional[str] = None

class SaveGameRequest(BaseModel):
    rounds: List[GameRoundRecord]
    total_score: float

class GameHistoryRound(BaseModel):
    round_number: int
    prompt_name: str
    difficulty: str
    score_earned: float
    doodle_image: Optional[str] = None

class GameHistoryItem(BaseModel):
    id: int
    total_score: float
    rounds_count: int
    created_at: str
    rounds: List[GameHistoryRound]
