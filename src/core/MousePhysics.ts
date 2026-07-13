import { clamp } from '../utils/clamp';
import { damp } from '../utils/damp';
import { lerp } from '../utils/lerp';

/** Coordenadas bidimensionales independientes de cualquier sistema de renderizado. */
export interface MouseVector {
  readonly x: number;
  readonly y: number;
}

/** Velocidad instantánea amortiguada y sus magnitudes derivadas por el núcleo físico. */
export interface MouseVelocity extends MouseVector {
  readonly smoothedX: number;
  readonly smoothedY: number;
  readonly speed: number;
  readonly direction: MouseVector;
}

/** Opciones que definen la respuesta física del motor, expresadas por segundo. */
export interface MousePhysicsOptions {
  /** Amortiguación aplicada a la velocidad calculada. Mayor valor implica una respuesta más rápida. */
  readonly velocityDamping?: number;
  /** Amortiguación adicional para una señal apropiada para efectos visuales. */
  readonly smoothingDamping?: number;
  /** Máximo intervalo de integración aceptado, en segundos, para evitar saltos tras una pausa. */
  readonly maxDeltaTime?: number;
  /** Límite absoluto de velocidad, en unidades de coordenadas por segundo. */
  readonly maxVelocity?: number;
}

/**
 * Convierte muestras de posición en señales de movimiento estables y reutilizables.
 *
 * No conoce React, eventos ni el DOM: cualquier adaptador puede enviar coordenadas
 * mediante `update`. Esta separación permite que la misma física impulse video,
 * escenas Spline, modelos 3D o partículas sin cambios en este archivo.
 */
export class MousePhysics {
  private readonly velocityDamping: number;
  private readonly smoothingDamping: number;
  private readonly maxDeltaTime: number;
  private readonly maxVelocity: number;

  private mouseX = 0;
  private mouseY = 0;
  private previousMouseX = 0;
  private previousMouseY = 0;
  private velocityX = 0;
  private velocityY = 0;
  private smoothedVelocityX = 0;
  private smoothedVelocityY = 0;
  private accelerationX = 0;
  private accelerationY = 0;
  private timestamp = 0;
  private deltaTime = 0;
  private hasSample = false;

  /**
   * @param options - Ajustes opcionales para adaptar la respuesta a cada experiencia.
   */
  public constructor(options: MousePhysicsOptions = {}) {
    this.velocityDamping = options.velocityDamping ?? 24;
    this.smoothingDamping = options.smoothingDamping ?? 12;
    this.maxDeltaTime = options.maxDeltaTime ?? 0.1;
    this.maxVelocity = options.maxVelocity ?? Number.POSITIVE_INFINITY;

    this.validateOptions();
  }

  /**
   * Registra una nueva posición.
   *
   * @param x - Coordenada horizontal en cualquier unidad coherente elegida por el consumidor.
   * @param y - Coordenada vertical en la misma unidad que `x`.
   * @param timestamp - Tiempo de la muestra en milisegundos; se puede inyectar para simulaciones deterministas.
   */
  public update(x: number, y: number, timestamp = Date.now()): void {
    this.validateSample(x, y, timestamp);

    if (!this.hasSample) {
      this.mouseX = x;
      this.mouseY = y;
      this.previousMouseX = x;
      this.previousMouseY = y;
      this.timestamp = timestamp;
      this.hasSample = true;
      return;
    }

    const previousVelocityX = this.velocityX;
    const previousVelocityY = this.velocityY;

    this.deltaTime = clamp((timestamp - this.timestamp) / 1_000, 0, this.maxDeltaTime);
    this.previousMouseX = this.mouseX;
    this.previousMouseY = this.mouseY;
    this.mouseX = x;
    this.mouseY = y;
    this.timestamp = timestamp;

    this.velocityX = this.calculateVelocity(this.mouseX, this.previousMouseX, previousVelocityX);
    this.velocityY = this.calculateVelocity(this.mouseY, this.previousMouseY, previousVelocityY);

    const smoothingFactor = clamp(
      1 - Math.exp(-this.smoothingDamping * this.deltaTime),
      0,
      1,
    );
    this.smoothedVelocityX = lerp(this.smoothedVelocityX, this.velocityX, smoothingFactor);
    this.smoothedVelocityY = lerp(this.smoothedVelocityY, this.velocityY, smoothingFactor);

    this.accelerationX = this.calculateAcceleration(this.velocityX, previousVelocityX);
    this.accelerationY = this.calculateAcceleration(this.velocityY, previousVelocityY);
  }

  /** Restablece todas las muestras y señales, dejando el motor listo para una nueva interacción. */
  public reset(): void {
    this.mouseX = 0;
    this.mouseY = 0;
    this.previousMouseX = 0;
    this.previousMouseY = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.smoothedVelocityX = 0;
    this.smoothedVelocityY = 0;
    this.accelerationX = 0;
    this.accelerationY = 0;
    this.timestamp = 0;
    this.deltaTime = 0;
    this.hasSample = false;
  }

  /** @returns La velocidad amortiguada, su señal suavizada, magnitud y dirección, por segundo. */
  public getVelocity(): MouseVelocity {
    const speed = Math.hypot(this.velocityX, this.velocityY);

    return {
      x: this.velocityX,
      y: this.velocityY,
      smoothedX: this.smoothedVelocityX,
      smoothedY: this.smoothedVelocityY,
      speed,
      direction: speed === 0
        ? { x: 0, y: 0 }
        : { x: this.velocityX / speed, y: this.velocityY / speed },
    };
  }

  /** @returns La aceleración de la velocidad amortiguada, por segundo al cuadrado. */
  public getAcceleration(): MouseVector {
    return { x: this.accelerationX, y: this.accelerationY };
  }

  /** @returns El tiempo integrado de la última muestra, en segundos. */
  public getDelta(): number {
    return this.deltaTime;
  }

  /** @returns La posición de la última muestra. */
  public getMouse(): MouseVector {
    return { x: this.mouseX, y: this.mouseY };
  }

  private validateOptions(): void {
    if (this.velocityDamping < 0 || this.smoothingDamping < 0) {
      throw new RangeError('Damping values must be greater than or equal to zero.');
    }

    if (this.maxDeltaTime <= 0 || this.maxVelocity < 0) {
      throw new RangeError('maxDeltaTime must be positive and maxVelocity cannot be negative.');
    }
  }

  private validateSample(x: number, y: number, timestamp: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(timestamp)) {
      throw new TypeError('MousePhysics samples must contain finite coordinates and timestamps.');
    }
  }

  /** Calcula una velocidad limitada y amortiguada para cualquiera de los ejes. */
  private calculateVelocity(currentPosition: number, previousPosition: number, previousVelocity: number): number {
    if (this.deltaTime === 0) {
      return 0;
    }

    const rawVelocity = clamp(
      (currentPosition - previousPosition) / this.deltaTime,
      -this.maxVelocity,
      this.maxVelocity,
    );

    return damp(previousVelocity, rawVelocity, this.velocityDamping, this.deltaTime);
  }

  /** Calcula la variación temporal de una señal de velocidad para cualquiera de los ejes. */
  private calculateAcceleration(currentVelocity: number, previousVelocity: number): number {
    return this.deltaTime === 0 ? 0 : (currentVelocity - previousVelocity) / this.deltaTime;
  }
}
