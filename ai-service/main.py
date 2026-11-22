from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from typing import Optional, List, Dict, Any
import time
import json
import uuid

from services.chat_engine import ChatEngine
from services.logger import ChatLogger

app = FastAPI(
    title="Restaurant OS — AI Microservice",
    description="Voice-to-Order Whisper processing, Guest AI Chat (SSE + RAG + Booking Tools)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chat_engine = ChatEngine()
chat_logger = ChatLogger()

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

class ChatRequest(BaseModel):
    session_id: str
    message: str

class FeedbackRequest(BaseModel):
    session_id: str
    message_id: Optional[str] = None
    rating: int
    note: Optional[str] = None

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
    
    return {
        "success": True,
        "raw_transcript": "Cho 2 phở bò tái và 1 trà đá ít đường",
        "extracted_items": [
            {"dish_name": "Phở bò tái", "quantity": 2, "notes": ""},
            {"dish_name": "Trà đá", "quantity": 1, "notes": "ít đường"}
        ],
        "confidence": 0.96
    }

@app.post("/api/v1/chat")
async def chat_stream(req: ChatRequest):
    # Validate UUID
    try:
        uuid_obj = uuid.UUID(req.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="session_id must be a valid UUID")

    async def event_generator():
        try:
            for item in chat_engine.process_chat_stream(str(uuid_obj), req.message):
                yield {
                    "event": item["event"],
                    "data": item["data"]
                }
        except Exception as e:
            yield {
                "event": "error",
                "data": "Rất tiếc, hệ thống tạm thời gặp trục trặc khi kết nối. Quý khách vui lòng thử lại sau giây lát ạ!"
            }

    return EventSourceResponse(event_generator())

@app.post("/api/v1/chat/feedback")
async def chat_feedback(fb: FeedbackRequest):
    if fb.rating < 1 or fb.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    chat_logger.log_feedback(fb.session_id, fb.rating, fb.message_id, fb.note)
    return {"status": "success", "message": "Feedback recorded successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
