import { useEffect, useRef } from 'react';

/** Datos temporales de un fotograma de animación, todos expresados en segundos salvo `frame`. */
export interface AnimationFrameState {
  /** Tiempo transcurrido desde el fotograma anterior. El primer valor es `0`. */
  readonly deltaTime: number;
  /** Tiempo acumulado desde el inicio del loop. */
  readonly elapsedTime: number;
  /** Índice del fotograma actual, comenzando en `0`. */
  readonly frame: number;
}

/** Función invocada una vez por cada fotograma de animación activo. */
export type AnimationFrameCallback = (state: AnimationFrameState) => void;

/**
 * Inicia un loop de `requestAnimationFrame` al montar y lo cancela al desmontar.
 *
 * La referencia interna mantiene el callback más reciente sin reiniciar el loop en cada
 * render. El hook no conoce componentes concretos y puede impulsar cualquier consumidor
 * que requiera una señal temporal: video, Spline, partículas o modelos interactivos.
 *
 * @param callback - Operación a ejecutar en cada fotograma.
 */
export function useAnimationFrame(callback: AnimationFrameCallback): void {
  const callbackReference = useRef(callback);

  useEffect(() => {
    callbackReference.current = callback;
  }, [callback]);

  useEffect(() => {
    let animationFrameId: number | undefined;
    let previousTimestamp: number | undefined;
    let startTimestamp: number | undefined;
    let frame = 0;

    const tick = (timestamp: number): void => {
      startTimestamp ??= timestamp;
      const deltaTime = previousTimestamp === undefined ? 0 : (timestamp - previousTimestamp) / 1_000;

      callbackReference.current({
        deltaTime,
        elapsedTime: (timestamp - startTimestamp) / 1_000,
        frame,
      });

      previousTimestamp = timestamp;
      frame += 1;
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
}
