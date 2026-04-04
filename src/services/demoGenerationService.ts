import {
  ApiError,
} from './api';
import { Artifact, GenerationPayload, GenerationResponse } from '../types';

const DEMO_STAGE_DELAYS = {
  pending: 700,
  processing: 1500,
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${remainingSeconds.toFixed(1).padStart(4, '0')}s`;
}

function outputTypeLabel(outputClass: string) {
  const normalized = outputClass.toLowerCase();
  if (normalized.includes('speech')) {
    return 'Speech';
  }
  if (normalized.includes('music')) {
    return 'Music';
  }
  if (normalized.includes('atmosphere')) {
    return 'Atmosphere';
  }
  return 'SFX';
}

function buildWaveformHeights(seedText: string, qualityMode: GenerationPayload['config']['qualityMode']) {
  const barCount = qualityMode === 'fast' ? 18 : qualityMode === 'high-quality' ? 30 : 24;
  let seed = 0;

  for (const char of seedText) {
    seed = (seed * 31 + char.charCodeAt(0)) % 2147483647;
  }

  return Array.from({ length: barCount }, (_, index) => {
    seed = (seed * 48271 + index + 17) % 2147483647;
    const normalized = (seed % 1000) / 1000;
    return Math.max(4, Math.round(6 + normalized * 22));
  });
}

function buildDemoTitle(payload: GenerationPayload) {
  const sourceDescriptor = payload.videoFileName
    ? payload.videoFileName.replace(/\.[^.]+$/, '')
    : payload.imageFileName
      ? payload.imageFileName.replace(/\.[^.]+$/, '')
      : payload.outputClass;

  const suffix =
    payload.config.qualityMode === 'fast'
      ? 'Preview'
      : payload.config.qualityMode === 'high-quality'
        ? 'Master'
        : 'Studio';

  return `${sourceDescriptor}_${suffix}`.replace(/\s+/g, '_').slice(0, 32);
}

export function shouldUseDemoMode(error: unknown) {
  if (error instanceof ApiError) {
    if (!error.status) {
      return true;
    }

    return error.status >= 500 || error.status === 404 || error.status === 405 || error.status === 422;
  }

  if (!(error instanceof Error)) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch')
    || message.includes('networkerror')
    || message.includes('load failed')
    || message.includes('backend')
    || message.includes('fetch')
    || message.includes('did not complete within')
    || message.includes('did not return a completed artifact')
  );
}

export async function runDemoGeneration(
  payload: GenerationPayload,
  onStatusUpdate?: (response: GenerationResponse) => void,
): Promise<GenerationResponse> {
  const id = `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const pending: GenerationResponse = {
    id,
    status: 'pending',
  };

  onStatusUpdate?.(pending);
  await wait(DEMO_STAGE_DELAYS.pending);

  const processing: GenerationResponse = {
    id,
    status: 'processing',
  };

  onStatusUpdate?.(processing);
  await wait(DEMO_STAGE_DELAYS.processing);

  const seedText = [
    payload.prompt,
    payload.videoFileName,
    payload.imageFileName,
    payload.outputClass,
    payload.config.qualityMode,
  ].filter(Boolean).join('|');

  const artifact: Artifact = {
    id,
    title: buildDemoTitle(payload),
    type: outputTypeLabel(payload.outputClass),
    duration: formatDuration(payload.duration),
    heights: buildWaveformHeights(seedText, payload.config.qualityMode),
    createdAt: payload.requestedAt,
    prompt: payload.prompt,
    sourceType: payload.videoRef && payload.imageRef
      ? 'video+image'
      : payload.videoRef
        ? 'video'
        : payload.imageRef
          ? 'image'
          : payload.videoFileName && payload.imageFileName
            ? 'video+image'
            : payload.videoFileName
              ? 'video'
              : payload.imageFileName
                ? 'image'
                : 'text',
    previewMetadata: {
      barCount: buildWaveformHeights(seedText, payload.config.qualityMode).length,
      hasWaveform: true,
      outputClass: payload.outputClass,
      languageModel: payload.languageModel,
      acousticStyle: payload.acousticStyle,
      hasVisualConditioning: Boolean(payload.videoRef || payload.imageRef || payload.videoFileName || payload.imageFileName),
      qualityMode: payload.config.qualityMode,
    },
    generationConfig: { ...payload.config },
    runtimeMode: 'demo',
    inputSnapshot: {
      videoFileName: payload.videoFileName,
      imageFileName: payload.imageFileName,
      requestedAt: payload.requestedAt,
    },
  };

  const completed: GenerationResponse = {
    id,
    status: 'completed',
    artifact,
  };

  onStatusUpdate?.(completed);
  return completed;
}
