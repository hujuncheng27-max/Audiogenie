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

export interface WorkspaceState {
  videoFile: File | null;
  imageFile: File | null;
  prompt: string;
  outputClass: string;
  languageModel: string;
  acousticStyle: string;
  duration: number;
}
