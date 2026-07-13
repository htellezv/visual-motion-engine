/** Vector bidimensional neutral que puede representar señales físicas o visuales. */
export interface MotionVector {
  readonly x: number;
  readonly y: number;
}

/**
 * Contrato de entrada del motor visual.
 *
 * Describe señales físicas ya procesadas, sin imponer de dónde proceden. Puede alimentarse
 * desde `MousePhysics`, un giroscopio, una escena 3D o una fuente de datos grabada.
 */
export interface MotionInput {
  /** Velocidad amortiguada en unidades por segundo. */
  readonly velocity: MotionVector;
  /** Velocidad con suavizado adicional, apropiada para presentación visual. */
  readonly smoothedVelocity: MotionVector;
  /** Aceleración en unidades por segundo al cuadrado. */
  readonly acceleration: MotionVector;
  /** Magnitud de la velocidad amortiguada, en unidades por segundo. */
  readonly speed: number;
  /** Dirección normalizada del movimiento o el vector nulo si está detenido. */
  readonly direction: MotionVector;
  /** Tiempo transcurrido desde la actualización anterior, en segundos. */
  readonly deltaTime: number;
}
