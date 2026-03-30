from fastapi import APIRouter, UploadFile, File
from ..schemas import UploadResponse
from ..services.storage import storage_service

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/video", response_model=UploadResponse)
async def upload_video(file: UploadFile = File(...)):
    ref = storage_service.save_file(file.filename)
    return UploadResponse(ref=ref)

@router.post("/image", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    ref = storage_service.save_file(file.filename)
    return UploadResponse(ref=ref)
