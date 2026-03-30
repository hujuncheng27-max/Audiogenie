/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Artifact, GenerationPayload, GenerationResponse } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const DEFAULT_POLL_INTERVAL_MS = 1200;
const DEFAULT_POLL_TIMEOUT_MS = 45000;

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      if (typeof errorData?.detail === 'string') {
        message = errorData.detail;
      }
    } catch {
      // Fall back to the default error message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

/**
 * Uploads a video file to the backend.
 */
export async function uploadVideo(file: File): Promise<{ ref: string }> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<{ ref: string }>('/upload/video', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Uploads an image file to the backend.
 */
export async function uploadImage(file: File): Promise<{ ref: string }> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<{ ref: string }>('/upload/image', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Initiates a new audio generation job.
 */
export async function createGeneration(payload: GenerationPayload): Promise<GenerationResponse> {
  return apiRequest<GenerationResponse>('/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches the list of all generations/artifacts.
 */
export async function getGenerations(): Promise<Artifact[]> {
  return apiRequest<Artifact[]>('/generations');
}

/**
 * Fetches a specific generation by ID.
 */
export async function getGenerationById(id: string): Promise<GenerationResponse> {
  return apiRequest<GenerationResponse>(`/generations/${id}`);
}

/**
 * Exports a generation (e.g., triggers a download or returns a URL).
 */
export async function exportGeneration(id: string): Promise<{ url: string }> {
  return apiRequest<{ url: string }>(`/generations/${id}/export`, {
    method: 'POST',
  });
}

/**
 * Polls for the status of a generation job.
 */
export async function pollGenerationStatus(
  id: string,
  onStatusUpdate?: (response: GenerationResponse) => void,
): Promise<GenerationResponse> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < DEFAULT_POLL_TIMEOUT_MS) {
    const result = await apiRequest<GenerationResponse>(`/generations/${id}/status`);
    onStatusUpdate?.(result);

    if (result.status === 'completed' || result.status === 'failed') {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, DEFAULT_POLL_INTERVAL_MS));
  }

  throw new Error(`Generation ${id} did not complete within ${DEFAULT_POLL_TIMEOUT_MS / 1000} seconds.`);
}
