from fastapi import APIRouter, HTTPException
from app.models import PredictRequest, PredictResponse
from app.model_service import model_service

router = APIRouter(prefix="/api", tags=["Inference"])

@router.post("/predict", response_model=PredictResponse)
def predict_doodle(payload: PredictRequest):
    if not payload.image:
        raise HTTPException(status_code=400, detail="Image data is required")
    
    result = model_service.predict(payload.image, payload.target_class)
    return result

@router.get("/model/status")
def get_model_status():
    model_service.check_and_reload_model()
    return {
        "is_model_loaded": model_service.model_loaded,
        "input_shape": list(model_service.model_input_shape),
        "total_classes": len(model_service.id_to_class),
        "classes_counts": {
            "easy": len(model_service.easy_classes),
            "medium": len(model_service.medium_classes),
            "hard": len(model_service.hard_classes),
        },
        "model_file": model_service.model is not None
    }

@router.post("/model/reload")
def reload_model():
    success = model_service.load_model()
    return {
        "success": success,
        "is_model_loaded": model_service.model_loaded,
        "message": "Model loaded successfully" if success else "Failed to load model or file not found"
    }
