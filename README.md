# AudioGenie

AudioGenie is a full-stack AI audio-generation app with a React + TypeScript frontend and a FastAPI backend.

## Current Architecture

- Frontend: Vite + React + TypeScript in `src/`
- Backend: FastAPI in `backend/app/`
- API base URL: `VITE_API_BASE_URL`, configured locally in `.env.local`
- Backend storage/generation behavior: in-memory mock services that keep the UI flow working end-to-end

## Implemented End-to-End Flows

- Upload video: `POST /upload/video`
- Upload image: `POST /upload/image`
- Create generation: `POST /generations`
- Poll generation status: `GET /generations/{id}/status`
- Load history: `GET /generations`
- Load generation detail: `GET /generations/{id}`
- Export generated audio: `POST /generations/{id}/export`

## Local Setup

### 1. Install dependencies

Frontend:

```bash
npm install
```

Backend:

```bash
python -m pip install -r backend/requirements.txt
```

### 2. Configure environment

The local frontend uses:

```env
VITE_API_BASE_URL="http://localhost:8000"
```

This is already set in `.env.local`.

### 3. Start the backend

```bash
npm run dev:backend
```

Or directly:

```bash
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Start the frontend

In a second terminal:

```bash
npm run dev:frontend
```

The frontend runs on `http://localhost:3000`.

## Local Verification Checklist

1. Open `http://localhost:3000`
2. Confirm the workspace loads existing history cards from the backend
3. Upload a video or image and enter a prompt
4. Click `Generate Audio`
5. Wait for the processing view to finish and transition into results
6. Confirm the new artifact appears in the results/history list
7. Click `Export Master` and verify a `.wav` download starts

## Notes

- The backend generation pipeline is still mock/in-memory by design, but the frontend now makes real HTTP requests instead of returning local fake data.
- Export returns a locally downloadable mock WAV file so the export flow can be tested end-to-end.
