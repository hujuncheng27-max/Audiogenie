import { Artifact } from '../types';

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function createLocalExportUrl(artifact: Artifact): string {
  const sampleRate =
    artifact.generationConfig.outputSampleRate === '44.1 kHz'
      ? 44100
      : artifact.generationConfig.outputSampleRate === '96 kHz'
        ? 96000
        : 48000;
  const channelCount =
    artifact.generationConfig.channels === 'Mono'
      ? 1
      : artifact.generationConfig.channels === '5.1 Surround'
        ? 6
        : 2;
  const bytesPerSample =
    artifact.generationConfig.bitDepth === '16 bit'
      ? 2
      : artifact.generationConfig.bitDepth === '32 bit'
        ? 4
        : 3;
  const secondsPerBar = 0.08;
  const heights = artifact.heights.length > 0 ? artifact.heights : [6, 10, 14, 10, 6];
  const totalSamples = Math.max(1, Math.floor(heights.length * secondsPerBar * sampleRate));
  const dataSize = totalSamples * bytesPerSample * channelCount;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample * channelCount, true);
  view.setUint16(32, bytesPerSample * channelCount, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;

  for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 1) {
    const normalizedProgress = sampleIndex / totalSamples;
    const barIndex = Math.min(heights.length - 1, Math.floor(normalizedProgress * heights.length));
    const qualityMultiplier =
      artifact.generationConfig.qualityMode === 'fast'
        ? 0.8
        : artifact.generationConfig.qualityMode === 'high-quality'
          ? 1.2
          : 1;
    const frequency = (180 + heights[barIndex] * 18) * qualityMultiplier;
    const amplitude = Math.min(0.7, (0.18 + heights[barIndex] / 22) * qualityMultiplier);
    const sampleValue = Math.sin((2 * Math.PI * frequency * sampleIndex) / sampleRate) * amplitude;

    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      if (bytesPerSample === 2) {
        view.setInt16(offset, sampleValue * 32767, true);
      } else if (bytesPerSample === 3) {
        const value = Math.max(-8388608, Math.min(8388607, Math.round(sampleValue * 8388607)));
        view.setUint8(offset, value & 0xff);
        view.setUint8(offset + 1, (value >> 8) & 0xff);
        view.setUint8(offset + 2, (value >> 16) & 0xff);
      } else {
        view.setInt32(offset, sampleValue * 2147483647, true);
      }
      offset += bytesPerSample;
    }
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}
