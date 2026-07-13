import type { MotionInput, MotionVector } from './MotionInput';
import { clamp } from '../utils/clamp';
import { damp } from '../utils/damp';
import { lerp } from '../utils/lerp';

/** Estado visual completamente resuelto para un fotograma. */
export interface MotionFrame {
  readonly rotation: MotionVector;
  readonly translation: MotionVector;
  readonly scale: number;
  readonly opacity: number;
  readonly floatOffset: number;
  /** Intensidad normalizada de movimiento, en el intervalo cerrado `[0, 1]`. */
  readonly energy: number;
  /** Velocidad amortiguada recibida en la última actualización. */
  readonly velocity: MotionVector;
  readonly speed: number;
  readonly direction: MotionVector;
}

/** Parámetros que convierten señales físicas abstractas en una respuesta visual. */
export interface MotionEngineConfig {
  readonly rotationIntensity: number;
  readonly translationIntensity: number;
  readonly scaleIntensity: number;
  readonly floatAmplitude: number;
  readonly floatSpeed: number;
  /** Factor que normaliza la velocidad de entrada al rango de energía `[0, 1]`. */
  readonly energyIntensity: number;
  /** Rapidez, por segundo, con la que los valores visuales se aproximan a su objetivo. */
  readonly damping: number;
}

/** Valores seguros y neutros para una interacción de interfaz estándar. */
const DEFAULT_CONFIG: MotionEngineConfig = {
  rotationIntensity: 0.015,
  translationIntensity: 0.02,
  scaleIntensity: 0.0002,
  floatAmplitude: 8,
  floatSpeed: 1,
  energyIntensity: 0.004,
  damping: 14,
};

/**
 * Transforma `MotionInput` en valores visuales independientes de cualquier renderer.
 *
 * No conoce React, el DOM, punteros, modelos ni medios. El consumidor proporciona señales
 * físicas mediante `update` y decide después cómo aplicar el `MotionFrame` resultante.
 */
export class MotionEngine {
  private config: MotionEngineConfig;

  private rotation: MotionVector = { x: 0, y: 0 };
  private translation: MotionVector = { x: 0, y: 0 };
  private scale = 1;
  private opacity = 1;
  private floatOffset = 0;
  private energy = 0;
  private velocity: MotionVector = { x: 0, y: 0 };
  private speed = 0;
  private direction: MotionVector = { x: 0, y: 0 };
  private elapsedTime = 0;

  /** @param config - Ajustes parciales que sustituyen la configuración predeterminada. */
  public constructor(config: Partial<MotionEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validateConfig(this.config);
  }

  /**
   * Procesa una muestra física y actualiza el estado visual completo.
   *
   * La amortiguación utiliza `deltaTime`, por lo que la respuesta es consistente entre
   * distintas frecuencias de renderizado.
   *
   * @param input - Señales físicas agnósticas del origen de entrada.
   * @returns La instantánea visual calculada para esta actualización.
   */
  public update(input: MotionInput): MotionFrame {
    this.validateInput(input);
    this.elapsedTime += input.deltaTime;
    this.velocity = { ...input.velocity };
    this.speed = input.speed;
    this.direction = { ...input.direction };

    const visualVelocity: MotionVector = {
      x: lerp(input.smoothedVelocity.x, input.velocity.x, 0.25),
      y: lerp(input.smoothedVelocity.y, input.velocity.y, 0.25),
    };
    const rotationTarget = {
      x: clamp(-visualVelocity.y * this.config.rotationIntensity, -45, 45),
      y: clamp(visualVelocity.x * this.config.rotationIntensity, -45, 45),
    };
    const translationTarget = {
      x: clamp(visualVelocity.x * this.config.translationIntensity, -2_000, 2_000),
      y: clamp(visualVelocity.y * this.config.translationIntensity, -2_000, 2_000),
    };
    const scaleTarget = lerp(1, 2, clamp(input.speed * this.config.scaleIntensity, 0, 1));
    const opacityTarget = lerp(1, 0.65, clamp(input.speed * this.config.scaleIntensity * 0.5, 0, 1));
    const energyTarget = clamp(input.speed * this.config.energyIntensity, 0, 1);
    const floatPhase = clamp((Math.sin(this.elapsedTime * this.config.floatSpeed) + 1) / 2, 0, 1);
    const floatTarget = lerp(-this.config.floatAmplitude, this.config.floatAmplitude, floatPhase);

    this.rotation = {
      x: this.smooth(this.rotation.x, rotationTarget.x, input.deltaTime, 45),
      y: this.smooth(this.rotation.y, rotationTarget.y, input.deltaTime, 45),
    };
    this.translation = {
      x: this.smooth(this.translation.x, translationTarget.x, input.deltaTime, 2_000),
      y: this.smooth(this.translation.y, translationTarget.y, input.deltaTime, 2_000),
    };
    this.scale = this.smooth(this.scale, scaleTarget, input.deltaTime, 2);
    this.opacity = this.smooth(this.opacity, opacityTarget, input.deltaTime, 1);
    this.floatOffset = this.smooth(this.floatOffset, floatTarget, input.deltaTime, this.config.floatAmplitude);
    this.energy = this.smooth(this.energy, energyTarget, input.deltaTime, 1);

    return this.getFrame();
  }

  /** @returns Una instantánea inmutable del último estado visual calculado. */
  public getFrame(): MotionFrame {
    return {
      rotation: this.getRotation(),
      translation: this.getTranslation(),
      scale: this.getScale(),
      opacity: this.getOpacity(),
      floatOffset: this.getFloatOffset(),
      energy: this.getEnergy(),
      velocity: { ...this.velocity },
      speed: this.speed,
      direction: { ...this.direction },
    };
  }

  /** @returns Rotación visual actual, en grados. */
  public getRotation(): MotionVector {
    return { ...this.rotation };
  }

  /** @returns Desplazamiento visual actual, en unidades de renderer. */
  public getTranslation(): MotionVector {
    return { ...this.translation };
  }

  /** @returns Escala visual actual. */
  public getScale(): number {
    return this.scale;
  }

  /** @returns Opacidad visual actual en el intervalo cerrado `[0, 1]`. */
  public getOpacity(): number {
    return this.opacity;
  }

  /** @returns Offset vertical de flotación actual, en unidades de renderer. */
  public getFloatOffset(): number {
    return this.floatOffset;
  }

  /** @returns Energía visual actual en el intervalo cerrado `[0, 1]`. */
  public getEnergy(): number {
    return this.energy;
  }

  /** @returns Una copia de la configuración activa. */
  public getConfig(): MotionEngineConfig {
    return { ...this.config };
  }

  /**
   * Actualiza la respuesta visual sin sustituir el motor ni reiniciar los valores actuales.
   *
   * @param config - Propiedades de configuración que se desean modificar.
   */
  public setConfig(config: Partial<MotionEngineConfig>): void {
    const nextConfig = { ...this.config, ...config };
    this.validateConfig(nextConfig);
    this.config = nextConfig;
  }

  /** Limita un objetivo y lo aproxima con amortiguación exponencial independiente del FPS. */
  private smooth(current: number, target: number, deltaTime: number, limit: number): number {
    return damp(current, clamp(target, -limit, limit), this.config.damping, deltaTime);
  }

  private validateInput(input: MotionInput): void {
    const values = [
      input.velocity.x,
      input.velocity.y,
      input.smoothedVelocity.x,
      input.smoothedVelocity.y,
      input.acceleration.x,
      input.acceleration.y,
      input.speed,
      input.direction.x,
      input.direction.y,
      input.deltaTime,
    ];

    if (values.some((value) => !Number.isFinite(value)) || input.speed < 0 || input.deltaTime < 0) {
      throw new RangeError('MotionInput values must be finite; speed and deltaTime cannot be negative.');
    }
  }

  private validateConfig(config: MotionEngineConfig): void {
    const values = [
      config.rotationIntensity,
      config.translationIntensity,
      config.scaleIntensity,
      config.floatAmplitude,
      config.floatSpeed,
      config.energyIntensity,
      config.damping,
    ];

    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      throw new RangeError('MotionEngine configuration values must be finite and non-negative.');
    }
  }
}
