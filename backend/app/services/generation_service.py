import io
import json
import math
import uuid
import random
import wave
from typing import List, Optional

from ..schemas import GenerationStatus, Artifact, GenerationPayload, GenerationResponse
from .database import get_connection


class GenerationService:
    """Generation service backed by SQLite."""

    # ── helpers ────────────────────────────────────────────────────

    @staticmethod
    def _heights_to_str(heights: List[int]) -> str:
        return ",".join(str(h) for h in heights)

    @staticmethod
    def _str_to_heights(raw: Optional[str]) -> List[int]:
        if not raw:
            return []
        return [int(x) for x in raw.split(",") if x]

    @staticmethod
    def _row_to_response(row) -> GenerationResponse:
        artifact = None
        if row["art_title"] is not None:
            artifact = Artifact(
                id=row["id"],
                title=row["art_title"],
                type=row["art_type"],
                duration=row["art_duration"],
                heights=GenerationService._str_to_heights(row["art_heights"]),
            )
        return GenerationResponse(
            id=row["id"],
            status=GenerationStatus(row["status"]),
            artifact=artifact,
        )

    # ── public API (same interface as before) ─────────────────────

    def create_job(self, payload: GenerationPayload) -> str:
        job_id = f"gen_{uuid.uuid4().hex[:8]}"
        conn = get_connection()
        try:
            conn.execute(
                "INSERT INTO generations (id, status) VALUES (?, ?)",
                (job_id, GenerationStatus.PENDING.value),
            )
            conn.commit()
        finally:
            conn.close()
        return job_id

    def get_job(self, job_id: str) -> Optional[GenerationResponse]:
        conn = get_connection()
        try:
            row = conn.execute("SELECT * FROM generations WHERE id = ?", (job_id,)).fetchone()
        finally:
            conn.close()
        if not row:
            return None
        return self._row_to_response(row)

    def get_all_completed_artifacts(self) -> List[Artifact]:
        conn = get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM generations WHERE status = ? AND art_title IS NOT NULL",
                (GenerationStatus.COMPLETED.value,),
            ).fetchall()
        finally:
            conn.close()
        artifacts = []
        for row in rows:
            artifacts.append(
                Artifact(
                    id=row["id"],
                    title=row["art_title"],
                    type=row["art_type"],
                    duration=row["art_duration"],
                    heights=self._str_to_heights(row["art_heights"]),
                )
            )
        return artifacts

    def update_job_status(self, job_id: str) -> None:
        conn = get_connection()
        try:
            row = conn.execute("SELECT * FROM generations WHERE id = ?", (job_id,)).fetchone()
            if not row:
                return

            current = row["status"]

            if current == GenerationStatus.PENDING.value:
                conn.execute(
                    "UPDATE generations SET status = ? WHERE id = ?",
                    (GenerationStatus.PROCESSING.value, job_id),
                )
            elif current == GenerationStatus.PROCESSING.value:
                heights = [random.randint(2, 12) for _ in range(20)]
                conn.execute(
                    """UPDATE generations
                       SET status = ?, art_title = ?, art_type = ?,
                           art_duration = ?, art_heights = ?
                       WHERE id = ?""",
                    (
                        GenerationStatus.COMPLETED.value,
                        f"Synthesis_{job_id[-4:]}",
                        "SFX",
                        "00:15.0s",
                        self._heights_to_str(heights),
                        job_id,
                    ),
                )

            conn.commit()
        finally:
            conn.close()

    def build_mock_export(self, job_id: str) -> bytes:
        job = self.get_job(job_id)
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
