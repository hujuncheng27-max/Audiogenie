from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class GenerationStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Artifact(BaseModel):
    id: str
    title: str
    type: str
    duration: str
    heights: List[int]

class GenerationPayload(BaseModel):
    prompt: str
    outputClass: str
    languageModel: str
    acousticStyle: str
    duration: int
    videoRef: Optional[str] = None
    imageRef: Optional[str] = None

class GenerationResponse(BaseModel):
    id: str
    status: GenerationStatus
    artifact: Optional[Artifact] = None

class UploadResponse(BaseModel):
    ref: str

class ExportResponse(BaseModel):
    url: str
