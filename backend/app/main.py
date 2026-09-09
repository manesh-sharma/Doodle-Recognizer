import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.model_service import model_service
from app.routes import auth_routes, predict_routes, game_routes, multiplayer_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and load model/classes
    init_db()
    model_service.load_classes()
    model_service.load_model()
    yield

app = FastAPI(
    title="Doodle Recognizer API",
    description="Full-stack AI Doodle Recognition game with real-time inference, authentication, and game modes",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows development on Vite and any local port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(predict_routes.router)
app.include_router(game_routes.router)
app.include_router(multiplayer_routes.router)
app.include_router(multiplayer_routes.ws_router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "Doodle Recognizer API",
        "version": "1.0.0",
        "model_loaded": model_service.model_loaded,
        "classes_count": len(model_service.id_to_class)
    }
