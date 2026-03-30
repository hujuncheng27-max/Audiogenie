/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Artifact, GenerationPayload, GenerationResponse } from '../types';
import { MOCK_ARTIFACTS } from '../constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Uploads a video file to the backend.
 */
export async function uploadVideo(file: File): Promise<{ ref: string }> {
  console.log(`[API] Uploading video: ${file.name} to ${API_BASE_URL}`);
  // Mocking delay and response
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { ref: `video_ref_${Date.now()}` };
}

/**
 * Uploads an image file to the backend.
 */
export async function uploadImage(file: File): Promise<{ ref: string }> {
  console.log(`[API] Uploading image: ${file.name} to ${API_BASE_URL}`);
  // Mocking delay and response
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { ref: `image_ref_${Date.now()}` };
}

/**
 * Initiates a new audio generation job.
 */
export async function createGeneration(payload: GenerationPayload): Promise<GenerationResponse> {
  console.log(`[API] Creating generation with payload:`, payload);
  // Mocking delay and response
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    id: `gen_${Date.now()}`,
    status: 'pending'
  };
}

/**
 * Fetches the list of all generations/artifacts.
 */
export async function getGenerations(): Promise<Artifact[]> {
  console.log(`[API] Fetching all generations from ${API_BASE_URL}`);
  // Mocking delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return MOCK_ARTIFACTS;
}

/**
 * Fetches a specific generation by ID.
 */
export async function getGenerationById(id: string): Promise<GenerationResponse> {
  console.log(`[API] Fetching generation details for ID: ${id}`);
  // Mocking delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const artifact = MOCK_ARTIFACTS.find(a => a.id === id) || MOCK_ARTIFACTS[0];
  
  return {
    id,
    status: 'completed',
    artifact
  };
}

/**
 * Exports a generation (e.g., triggers a download or returns a URL).
 */
export async function exportGeneration(id: string): Promise<{ url: string }> {
  console.log(`[API] Exporting generation ID: ${id}`);
  // Mocking delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  return { url: `https://storage.example.com/exports/${id}.wav` };
}

/**
 * Polls for the status of a generation job.
 */
export async function pollGenerationStatus(id: string): Promise<GenerationResponse> {
  console.log(`[API] Polling status for ID: ${id}`);
  // Mocking a state transition: pending -> processing -> completed
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For mock purposes, we'll just return completed with a new artifact
  const newArtifact: Artifact = {
    id,
    title: `Synthesis_${id.slice(-4)}`,
    type: 'SFX',
    duration: '00:15.0s',
    heights: Array.from({ length: 20 }, () => Math.floor(Math.random() * 10) + 2)
  };

  return {
    id,
    status: 'completed',
    artifact: newArtifact
  };
}
