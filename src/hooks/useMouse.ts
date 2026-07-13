import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MousePhysics } from '../core/MousePhysics';
import type { MousePhysicsOptions, MouseVector } from '../core/MousePhysics';
import { useVelocity } from './useVelocity';
import type { VelocityState } from './useVelocity';

/** Estado de entrada expuesto por React, mientras que todos los cálculos pertenecen al núcleo. */
export interface MouseState {
  readonly mouse: MouseVector;
  readonly velocity: VelocityState['velocity'];
  readonly acceleration: MouseVector;
  readonly delta: number;
  /** Limpia la muestra y las señales físicas de la interacción actual. */
  readonly reset: () => void;
}

/**
 * Conecta los eventos de puntero y tacto del navegador con una única instancia de `MousePhysics`.
 *
 * Este hook no interpreta posiciones ni aplica suavizado: solo reenvía muestras al motor y
 * solicita un render de React. Las aplicaciones que usen otras fuentes de entrada pueden
 * reutilizar `MousePhysics` sin importar este archivo.
 *
 * @param options - Opciones físicas que se aplican al crear la instancia, una sola vez por montaje.
 * @returns Posición, velocidad, aceleración, delta y una operación de reinicio.
 */
export function useMouse(options: MousePhysicsOptions = {}): MouseState {
  const physicsReference = useRef<MousePhysics | null>(null);

  if (physicsReference.current === null) {
    physicsReference.current = new MousePhysics(options);
  }

  const physics = physicsReference.current;
  const [revision, setRevision] = useState(0);

  const publishSample = useCallback((x: number, y: number, timestamp: number): void => {
    physics.update(x, y, timestamp);
    setRevision((currentRevision) => currentRevision + 1);
  }, [physics]);

  const reset = useCallback((): void => {
    physics.reset();
    setRevision((currentRevision) => currentRevision + 1);
  }, [physics]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent): void => {
      publishSample(event.clientX, event.clientY, event.timeStamp);
    };

    const onPointerLeave = (): void => {
      reset();
    };

    const updateFromTouch = (event: TouchEvent): void => {
      const touch = event.touches.item(0);

      if (touch !== null) {
        publishSample(touch.clientX, touch.clientY, event.timeStamp);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('touchstart', updateFromTouch, { passive: true });
    window.addEventListener('touchmove', updateFromTouch, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('touchstart', updateFromTouch);
      window.removeEventListener('touchmove', updateFromTouch);
    };
  }, [publishSample, reset]);

  const velocityState = useVelocity(physics, revision);
  const mouse = useMemo(() => physics.getMouse(), [physics, revision]);
  const acceleration = useMemo(() => physics.getAcceleration(), [physics, revision]);
  const delta = useMemo(() => physics.getDelta(), [physics, revision]);

  return useMemo(() => ({
    mouse,
    velocity: velocityState.velocity,
    acceleration,
    delta,
    reset,
  }), [acceleration, delta, mouse, reset, velocityState.velocity]);
}
