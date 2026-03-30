/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type View = 'workspace' | 'processing' | 'results';

export interface Artifact {
  id: string;
  title: string;
  type: string;
  duration: string;
  heights: number[];
}

export interface GenerationPayload {
  prompt: string;
  outputClass: string;
  languageModel: string;
  acousticStyle: string;
  duration: number;
  videoRef?: string;
  imageRef?: string;
}

export interface GenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  artifact?: Artifact;
}
