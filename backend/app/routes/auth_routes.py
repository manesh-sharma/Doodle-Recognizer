from fastapi import APIRouter, HTTPException, Depends, status
from app.models import UserRegister, UserLogin, TokenResponse, UserProfile
from app.database import (
    create_user, get_user_by_username, get_user_by_id, get_user_stats
)
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister):
    existing = get_user_by_username(payload.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken"
        )
    
    hashed = hash_password(payload.password)
    user_id = create_user(payload.username, hashed, payload.email)
    user = get_user_by_id(user_id)
    
    token = create_access_token(user["id"], user["username"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "created_at": str(user["created_at"])
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin):
    user = get_user_by_username(payload.username)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    token = create_access_token(user["id"], user["username"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "created_at": str(user["created_at"])
        }
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    stats = get_user_stats(current_user["id"])
    return {
        "user": {
            "id": current_user["id"],
            "username": current_user["username"],
            "email": current_user["email"],
            "created_at": str(current_user["created_at"])
        },
        "stats": stats
    }
