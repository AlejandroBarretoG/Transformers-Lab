import { pipeline, env, Pipeline } from '@xenova/transformers';
import { SentimentResult, DeviceType, BenchmarkResult } from '../types';

// Configuración base de transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

class TransformersService {
  private static instance: Pipeline | null = null;
  private static currentDevice: DeviceType | null = null;
  private static task = 'sentiment-analysis';
  private static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

  static isWebGpuSupported(): boolean {
    return !!(navigator as any).gpu;
  }

  static isWebGlSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  /**
   * Configura el entorno global de transformers según el dispositivo solicitado
   */
  private static configureBackend(device: DeviceType) {
    switch (device) {
      case 'webgpu':
        env.backend = 'webgpu';
        break;
      case 'webgl':
        env.backend = 'webgl';
        break;
      case 'cpu':
      default:
        env.backend = 'wasm'; // Force WASM for CPU
        break;
    }
    console.log(`[Config] Backend solicitado: ${device} -> Env backend set to: ${env.backend}`);
  }

  static async loadModel(options: { device?: DeviceType; force?: boolean } = {}, progressCallback?: (data: any) => void) {
    const device = options.device || 'cpu';

    // Si ya existe una instancia y es el mismo dispositivo, retornarla, salvo que se fuerce recarga
    if (this.instance && this.currentDevice === device && !options.force) {
      return this.instance;
    }

    // Si cambiamos de dispositivo o forzamos, liberamos la instancia anterior
    if (this.instance) {
      console.log(`[Reload] Cambiando dispositivo de ${this.currentDevice} a ${device}...`);
      if ((this.instance as any).dispose) {
          await (this.instance as any).dispose();
      }
      this.instance = null;
    }

    this.configureBackend(device);
    this.currentDevice = device;

    // ESTRATEGIA CRÍTICA PARA BENCHMARK:
    // CPU: Usamos 'quantized: true' (q8). Es más rápido en CPU debido a instrucciones SIMD para enteros.
    // GPU: Usamos 'quantized: false' (fp32). WebGPU/WebGL a menudo carecen de kernels optimizados para int8,
    //      provocando un "fallback" silencioso a CPU. Al usar fp32, forzamos el uso real de shaders en GPU.
    const useQuantized = device === 'cpu'; 

    console.log(`[Load] Iniciando carga pipeline. Device: ${device}, Quantized: ${useQuantized} (Evita fallback)`);

    this.instance = await pipeline(this.task, this.model, {
      progress_callback: progressCallback,
      device: device, 
      quantized: useQuantized, // False para GPU (fp32), True para CPU (q8)
      // dtype: 'q8' // Eliminado explícitamente para permitir float32 en GPU
    });
    
    return this.instance;
  }

  static async analyzeSentiment(text: string): Promise<SentimentResult[]> {
    if (!this.instance) {
      await this.loadModel({ device: 'cpu' });
    }
    
    if (!this.instance) throw new Error("Model failed to load");

    const output = await this.instance(text);
    return output as SentimentResult[];
  }

  static async runDiagnostic(): Promise<boolean> {
    try {
      const start = performance.now();
      await this.loadModel({ device: 'cpu' }); 
      const end = performance.now();
      console.log(`Diagnóstico: Modelo verificado en ${(end - start).toFixed(2)}ms`);
      await this.analyzeSentiment("Diagnostic warm up");
      return true;
    } catch (e) {
      console.error("Diagnostic failed", e);
      return false;
    }
  }

  /**
   * Ejecuta un benchmark explícito en el backend solicitado.
   * @param text Texto para la prueba
   * @param device El backend a probar ('cpu' | 'webgl' | 'webgpu')
   */
  static async runBenchmark(text: string, device: DeviceType): Promise<BenchmarkResult> {
    const input = text || "Transformers.js brings state-of-the-art machine learning to the web. ".repeat(20);

    try {
        console.time(`Benchmark-${device}`);
        
        // 1. Forzar recarga completa en el dispositivo específico
        // Esto disparará la descarga del modelo FP32 si es GPU, o Q8 si es CPU
        await this.loadModel({ device, force: true });
        
        if (!this.instance) throw new Error("Failed to load instance for benchmark");

        // 2. Warm-up (crítico para compilación de shaders en GPU)
        // La primera ejecución siempre es más lenta por la compilación JIT de shaders
        console.log(`[Benchmark] Warming up ${device}...`);
        await this.instance("warmup");

        // 3. Medición precisa
        console.log(`[Benchmark] Running inference on ${device}...`);
        const start = performance.now();
        await this.instance(input);
        const end = performance.now();
        console.timeEnd(`Benchmark-${device}`);

        return {
            device,
            time: end - start,
            status: 'success'
        };
    } catch (error) {
        console.error(`Benchmark fallido para ${device}`, error);
        return {
            device,
            time: 0,
            status: 'error'
        };
    }
  }

  static getEngineInfo() {
    return {
      version: env.version,
      backend: env.backend,
      allowLocalModels: env.allowLocalModels,
      currentDevice: this.currentDevice,
      webGpuAvailable: this.isWebGpuSupported(),
      webGlAvailable: this.isWebGlSupported()
    };
  }
}

export default TransformersService;