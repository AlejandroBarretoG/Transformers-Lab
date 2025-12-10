import { pipeline, env, Pipeline } from '@xenova/transformers';
import { SentimentResult } from '../types';

// Configure transformers.js to use hosted models and cache
env.allowLocalModels = false;
env.useBrowserCache = true;

class TransformersService {
  private static instance: Pipeline | null = null;
  private static task = 'sentiment-analysis';
  private static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

  static async loadModel(progressCallback?: (data: any) => void) {
    if (!this.instance) {
      this.instance = await pipeline(this.task, this.model, {
        progress_callback: progressCallback,
      });
    }
    return this.instance;
  }

  static async analyzeSentiment(text: string): Promise<SentimentResult[]> {
    if (!this.instance) {
      await this.loadModel();
    }
    
    if (!this.instance) {
        throw new Error("Model failed to load");
    }

    const output = await this.instance(text);
    // The output is typically an array or object depending on the task
    // For sentiment-analysis: [{ label: 'POSITIVE', score: 0.99 }]
    return output as SentimentResult[];
  }

  static async runDiagnostic(): Promise<boolean> {
    try {
      const start = performance.now();
      await this.loadModel();
      const end = performance.now();
      console.log(`Model loaded/verified in ${(end - start).toFixed(2)}ms`);
      
      // Run a warm-up inference
      await this.analyzeSentiment("This is a diagnostic test.");
      return true;
    } catch (e) {
      console.error("Diagnostic failed", e);
      return false;
    }
  }

  static getEngineInfo() {
    return {
      version: env.version,
      backend: env.backend,
      allowLocalModels: env.allowLocalModels,
    };
  }
}

export default TransformersService;