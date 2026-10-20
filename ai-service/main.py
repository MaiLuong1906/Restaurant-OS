from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time

app = FastAPI(
    title="Restaurant OS — AI Microservice",
    description="Voice-to-Order Whisper processing and forecasting service",
    version="1.0.0"
)

# Enable CORS for frontend and backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: float

class VoiceOrderResponse(BaseModel):
    success: bool
    raw_transcript: str
    extracted_items: list[dict]
    confidence: float

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "1.0.0",
        "timestamp": time.time()
    }

@app.post("/api/v1/voice/transcribe-order", response_model=VoiceOrderResponse)
async def transcribe_order(audio: UploadFile = File(...)):
    if not audio.filename:
        raise HTTPException(status_code=400, detail="Không tìm thấy file âm thanh")
    
    # Skeleton implementation for Whisper voice-to-order pipeline
    return {
        "success": True,
        "raw_transcript": "Cho 2 phở bò tái và 1 trà đá ít đường",
        "extracted_items": [
            {"dish_name": "Phở bò tái", "quantity": 2, "notes": ""},
            {"dish_name": "Trà đá", "quantity": 1, "notes": "ít đường"}
        ],
        "confidence": 0.96
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
