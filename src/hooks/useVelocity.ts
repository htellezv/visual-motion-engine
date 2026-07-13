import { useMemo } from 'react';
import type { MousePhysics, MouseVector } from '../core/MousePhysics';

/** Señales de velocidad preparadas por {@link MousePhysics} para la capa React. */
export interface VelocityState {
  /** Velocidad amortiguada en unidades por segundo. */
  readonly velocity: MouseVector;
  /** Velocidad con suavizado adicional, adecuada para efectos visuales. */
  readonly smoothedVelocity: MouseVector;
  /** Magnitud de la velocidad amortiguada en unidades por segundo. */
  readonly speed: number;
  /** Vector unitario de desplazamiento; `{ x: 0, y: 0 }` cuando no hay movimiento. */
  readonly direction: MouseVector;
}

/**
 * Expone, sin recalcular física, las señales de velocidad de una instancia de `MousePhysics`.
 *
 * `revision` identifica una nueva muestra del motor. `useMouse` lo actualiza automáticamente;
 * un adaptador de entrada personalizado puede proporcionar su propio contador de revisión.
 *
 * @param physics - Instancia que posee toda la física de movimiento.
 * @param revision - Contador que cambia tras actualizar el motor.
 * @returns Señales de velocidad obtenidas exclusivamente desde el motor matemático.
 */
export function useVelocity(physics: MousePhysics, revision = 0): VelocityState {
  return useMemo(() => {
    const motion = physics.getVelocity();

    return {
      velocity: { x: motion.x, y: motion.y },
      smoothedVelocity: { x: motion.smoothedX, y: motion.smoothedY },
      speed: motion.speed,
      direction: motion.direction,
    };
  }, [physics, revision]);
}
