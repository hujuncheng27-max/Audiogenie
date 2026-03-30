import io
import math
import uuid
import random
import wave
from typing import Dict, List, Optional
from ..schemas import GenerationStatus, Artifact, GenerationPayload, GenerationResponse

class GenerationService:
    def __init__(self):
        # In-memory storage for generation jobs
        self.jobs: Dict[str, GenerationResponse] = {}
        
        # Initial mock data
        self._add_mock_data()

    def _add_mock_data(self):
        mock_artifacts = [
            Artifact(
                id="1",
                title="Synthesis_A1",
                type="SFX",
                duration="00:12.4s",
                heights=[4, 8, 12, 16, 24, 20, 14, 10, 12, 18, 22, 16, 12, 8, 4]
            ),
            Artifact(
                id="2",
                title="Synthesis_B2",
                type="Speech",
                duration="00:08.2s",
                heights=[8, 12, 16, 24, 20, 14, 10, 12, 18, 22, 16, 12, 8, 4, 8]
            ),
            Artifact(
                id="3",
                title="Synthesis_C3",
                type="Atmosphere",
                duration="00:30.0s",
                heights=[12, 16, 24, 20, 14, 10, 12, 18, 22, 16, 12, 8, 4, 8, 12]
            )
        ]
        for art in mock_artifacts:
            self.jobs[art.id] = GenerationResponse(id=art.id, status=GenerationStatus.COMPLETED, artifact=art)

    def create_job(self, payload: GenerationPayload) -> str:
        job_id = f"gen_{uuid.uuid4().hex[:8]}"
        self.jobs[job_id] = GenerationResponse(id=job_id, status=GenerationStatus.PENDING)
        return job_id

    def get_job(self, job_id: str) -> Optional[GenerationResponse]:
        return self.jobs.get(job_id)

    def get_all_completed_artifacts(self) -> List[Artifact]:
        return [job.artifact for job in self.jobs.values() if job.status == GenerationStatus.COMPLETED and job.artifact]

    def update_job_status(self, job_id: str):
        job = self.jobs.get(job_id)
        if not job:
            return

        if job.status == GenerationStatus.PENDING:
            job.status = GenerationStatus.PROCESSING
        elif job.status == GenerationStatus.PROCESSING:
            job.status = GenerationStatus.COMPLETED
            job.artifact = Artifact(
                id=job_id,
                title=f"Synthesis_{job_id[-4:]}",
                type="SFX",
                duration="00:15.0s",
                heights=[random.randint(2, 12) for _ in range(20)]
            )

    def build_mock_export(self, job_id: str) -> bytes:
        job = self.jobs.get(job_id)
        if not job or job.status != GenerationStatus.COMPLETED or not job.artifact:
            raise ValueError("Generation is not ready for export")

        sample_rate = 22050
        duration_seconds = 1.2
        total_frames = int(sample_rate * duration_seconds)
        tone_seed = sum(ord(char) for char in job_id[-4:])
        frequency = 220 + (tone_seed % 220)
        amplitude = 16000

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)

            frames = bytearray()
            for index in range(total_frames):
                sample = int(amplitude * math.sin((2 * math.pi * frequency * index) / sample_rate))
                frames.extend(sample.to_bytes(2, byteorder="little", signed=True))

            wav_file.writeframes(bytes(frames))

        return buffer.getvalue()

generation_service = GenerationService()
