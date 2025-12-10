export interface SentimentResult {
  label: string;
  score: number;
}

export interface DiagnosticResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export enum ModelStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface TestCase {
  text: string;
  expectedSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export type DeviceType = 'cpu' | 'webgpu' | 'webgl';

export interface BenchmarkResult {
  device: DeviceType;
  time: number;
  status: 'success' | 'error';
  speedup?: string;
}