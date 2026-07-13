/**
 * Aproxima un valor a un objetivo con amortiguación exponencial independiente del FPS.
 *
 * Usa la solución discreta de un decaimiento exponencial de primer orden:
 * `target + (current - target) × e^(-lambda × deltaTime)`.
 * La fracción recorrida en este paso es, por tanto, `1 - e^(-lambda × deltaTime)`.
 * Al depender del tiempo transcurrido y no de una cantidad fija por fotograma, el
 * resultado converge de forma equivalente a 30 FPS y a 144 FPS.
 *
 * @param current - Valor actual.
 * @param target - Valor de destino.
 * @param lambda - Intensidad de amortiguación por segundo. Debe ser no negativa.
 * @param deltaTime - Tiempo transcurrido en segundos. Debe ser no negativo.
 * @returns El siguiente valor amortiguado hacia `target`.
 * @throws {RangeError} Si `lambda` o `deltaTime` son negativos.
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  deltaTime: number,
): number {
  if (lambda < 0) {
    throw new RangeError('damp requires lambda to be greater than or equal to zero.');
  }

  if (deltaTime < 0) {
    throw new RangeError('damp requires deltaTime to be greater than or equal to zero.');
  }

  return target + (current - target) * Math.exp(-lambda * deltaTime);
}
