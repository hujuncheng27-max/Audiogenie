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

class GenerationConfig(BaseModel):
    qualityMode: str
    outputSampleRate: str
    bitDepth: str
    channels: str
    exportFormat: str
    keepHistory: str
    autoExportOnComplete: bool

class GenerationPayload(BaseModel):
    prompt: str
    outputClass: str
    languageModel: str
    acousticStyle: str
    duration: int
    videoRef: Optional[str] = None
    imageRef: Optional[str] = None
    config: Optional[GenerationConfig] = None

class GenerationResponse(BaseModel):
    id: str
    status: GenerationStatus
    artifact: Optional[Artifact] = None

class UploadResponse(BaseModel):
    ref: str

class ExportResponse(BaseModel):
    url: str
