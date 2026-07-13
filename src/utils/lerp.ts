/**
 * Interpola linealmente entre dos números.
 *
 * La fórmula es `start + (end - start) × t`. Para `t = 0` devuelve `start` y
 * para `t = 1` devuelve `end`. Los valores de `t` fuera de `[0, 1]` se admiten
 * deliberadamente para permitir extrapolación cuando el consumidor la necesite.
 *
 * @param start - Valor de origen.
 * @param end - Valor de destino.
 * @param t - Factor de interpolación, normalmente en el intervalo `[0, 1]`.
 * @returns El valor interpolado o extrapolado.
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
