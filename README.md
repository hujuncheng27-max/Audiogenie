# AudioGenie

AudioGenie is a full-stack multimodal audio-generation app. A React + TypeScript frontend
drives a FastAPI backend that runs a real multi-agent pipeline (planning / assign-refine /
Tree-of-Thought synthesis / mix) on top of HuggingFace Gradio Spaces for the actual model
inference.

Given a text prompt plus optional image or video, AudioGenie produces a layered audio track
composed of sound effects, speech, music and song, respecting the output category and target
duration selected in the UI.

## Architecture

```
  Frontend (Vite + React + TS, src/)
         │  POST /generations, GET /generations/{id}/status, ...
         ▼
  Backend (FastAPI, backend/app/)
         │  run_pipeline() → background thread
         ▼
  Multi-agent pipeline (repo root)
      agents.py        GenerationTeam / SupervisorTeam / AudioGenieSystem
      plan.py          AudioEvent / Plan schemas
      experts.py       SFX / Speech / Music / Song domain experts
      critiquers.py    Planning / domain / eval critics
      tot.py           Tree-of-Thought executor
      mixer.py         Final mix + optional video mux
         │
         ▼
  Tool adapters (tool/ + tools_v2.py)
      MMAudio            sound effects
      InspireMusic       background music
      DiffRhythm         song / vocals with melody
      CosyVoice2 / 3     speech / TTS
         │
         ▼
  HuggingFace Gradio Spaces (remote GPU inference)
```

### Pipeline stages

1. **Planning** — `GenerationTeam.plan()` asks the LLM to decompose the multimodal input
   into a JSON list of audio events (`audio_type`, `object`, `start_time`, `end_time`,
   `description`, `volume`). The user's output class and target duration are injected as
   soft hints.
2. **Hard constraint enforcement** — `_enforce_user_constraints()` filters events that
   don't match the selected category, clamps any event extending past the target duration,
   and synthesizes a fallback event if the filter empties the plan.
3. **Assign & refine** — events are routed to their domain experts, which rewrite the
   descriptions into tool-specific refined inputs and pick candidate models.
4. **Tree-of-Thought synthesis** — `tot.py` explores refined-input variants, calls the bound
   Gradio Space via the tool adapter, and selects the best candidate using the eval critic.
5. **Mix** — `mixer.py` composites all event wavs into the final track and optionally muxes
   it into the source video.

### LLM routing

Providers are configured in `config.yaml` under `llms:` and selected by key. Supported
providers: OpenAI-compatible (used for Kimi K2.5), Google Gemini, NVIDIA, HuggingFace,
Gradio. The default in this repo is **Kimi K2.5** via the OpenAI-compatible endpoint; the
`OpenaiLLM` adapter falls back to `reasoning_content` when Kimi returns an empty `content`
field.

## Local setup

### 1. Install dependencies

Frontend:

```bash
npm install
```

Backend + pipeline:

```bash
python -m pip install -r backend/requirements.txt
python -m pip install -r requirements.txt
```

### 2. Configure `config.yaml`

Copy `template/config_template.yaml` to `config.yaml` at the repo root and fill in:

- `basic.hf_token` — HuggingFace token used by every tool adapter. A Pro token is strongly
  recommended because ZeroGPU Spaces reserve a fixed GPU quota per request.
- `basic.media_upload` — optional HuggingFace dataset used as an intermediate store when a
  Gradio Space requires a URL instead of a local file.
- `llms.kimi.api_key` — Kimi API key (or substitute any other provider in the `llms:`
  section and change the `--llm` default).
- `tools.*` — the Gradio Space ID for each tool (MMAudio, InspireMusic, DiffRhythm,
  CosyVoice2/3).

`config.yaml` is gitignored so local secrets do not leak.

### 3. Frontend env

`.env.local` at the repo root:

```env
VITE_API_BASE_URL="http://localhost:8000"
```

### 4. Start the backend

```bash
npm run dev:backend
```

or

```bash
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

On startup the backend imports the multi-agent framework and eagerly constructs a shared
`ToolLibrary` singleton, handshaking with every Gradio Space listed in `config.yaml`. Slow
or unavailable Spaces are logged and skipped instead of crashing the whole registry.

### 5. Start the frontend

```bash
npm run dev:frontend
```

The frontend runs on `http://localhost:3000`.

## API endpoints

| Method | Path                             | Purpose                               |
|--------|----------------------------------|---------------------------------------|
| POST   | `/upload/video`                  | Upload a source video                 |
| POST   | `/upload/image`                  | Upload a source image                 |
| POST   | `/generations`                   | Create a generation job               |
| GET    | `/generations/{id}/status`       | Poll stage / stageDetail / status     |
| GET    | `/generations/{id}`              | Full job detail + artifact            |
| GET    | `/generations`                   | History of completed artifacts        |
| POST   | `/generations/{id}/export`       | Build an export URL                   |
| GET    | `/generations/{id}/export/download` | Download the exported file         |

The `status` endpoint returns one of `pending / processing / completed / failed`, plus a
`stage` (`uploading / planning / assigning / synthesizing / mixing / done`) and a human
readable `stageDetail` string, which the frontend uses to drive the ProcessingView progress
timeline.

## Local verification checklist

1. Open `http://localhost:3000`.
2. On the home page, go into the workspace.
3. Upload an image (or a video) and write a prompt; pick an output class (Sound Effects /
   Speech / Music / Atmosphere) and a target duration.
4. Click **Generate Audio**. The ProcessingView should show Planning → Assigning →
   Synthesizing → Mixing as the backend progresses.
5. When the job completes, the new artifact appears in History with its waveform preview.
6. Click **Export Master** and confirm a real `.wav` download starts.
7. If a tool fails, the job transitions to `failed` and the error text from the underlying
   Gradio Space is shown in the UI instead of silently returning a mock file.

## Project layout

```
agents.py              multi-agent orchestration
plan.py                Plan / AudioEvent dataclasses
experts.py             per-category domain experts
critiquers.py          planning / domain / eval critics
tot.py                 Tree-of-Thought synthesizer
mixer.py               final mix + video mux
llm.py                 LLM adapters (OpenAI-compatible, Gemini, NVIDIA, HF, Gradio)
router.py              load_llm from config.yaml
tools_v2.py            ToolLibrary registry + runtime binding
tool/                  Gradio Space adapters (one file per tool)
bin/                   standalone runners for each tool
utils/                 media probing, media uploader, runtime logger
tests/                 soft tests and API tests
template/              config_template.yaml
backend/app/           FastAPI routes, schemas, SQLite services
src/                   React + TypeScript frontend
docs/                  design notes (tot_memory_algorithm.md)
```

## Notes and limitations

- The backend does not mock the pipeline any more. Every successful run is the output of
  real remote inference. If no tool can deliver valid audio, the job fails fast with the
  underlying error aggregated across all ToT nodes.
- Each ZeroGPU Space call reserves a fixed GPU duration regardless of the requested length,
  so the free quota can run out quickly. Use a Pro HF token in `basic.hf_token` for serious
  testing.
- The eval critic is LLM-based. Text-only models (such as Kimi) return zero-vector scores;
  the ToT selection logic still promotes any valid wav when no scored winner exists, so
  these runs still deliver audio.
- `config.yaml`, `outputs/` and `backend/uploads/` are gitignored and stay local.
