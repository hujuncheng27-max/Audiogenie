import io
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import List
from ..schemas import GenerationPayload, GenerationResponse, Artifact, ExportResponse, GenerationStatus
from ..services.generation_service import generation_service

router = APIRouter(prefix="/generations", tags=["generations"])

@router.post("", response_model=GenerationResponse)
async def create_generation(payload: GenerationPayload):
    job_id = generation_service.create_job(payload)
    return generation_service.get_job(job_id)

@router.get("", response_model=List[Artifact])
async def get_generations():
    return generation_service.get_all_completed_artifacts()

@router.get("/{id}", response_model=GenerationResponse)
async def get_generation_by_id(id: str):
    job = generation_service.get_job(id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation not found")
    return job

@router.get("/{id}/status", response_model=GenerationResponse)
async def get_generation_status(id: str):
    # Simulate status transition on every poll
    generation_service.update_job_status(id)
    job = generation_service.get_job(id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation not found")
    return job

@router.post("/{id}/export", response_model=ExportResponse)
async def export_generation(id: str, request: Request):
    job = generation_service.get_job(id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation not found")
    if job.status != GenerationStatus.COMPLETED or not job.artifact:
        raise HTTPException(status_code=409, detail="Generation is not ready for export")

    return ExportResponse(url=str(request.url_for("download_export", id=id)))

@router.get("/{id}/export/download", name="download_export")
async def download_export(id: str):
    job = generation_service.get_job(id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation not found")
    if job.status != GenerationStatus.COMPLETED or not job.artifact:
        raise HTTPException(status_code=409, detail="Generation is not ready for export")

    audio_bytes = generation_service.build_mock_export(id)
    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/wav",
        headers={"Content-Disposition": f'attachment; filename="{id}.wav"'},
    )
