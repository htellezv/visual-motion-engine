/**
 * Restringe un número al intervalo cerrado `[min, max]`.
 *
 * Matemáticamente, el resultado es `min(max(value, min), max)`. Los valores que
 * ya pertenecen al intervalo se conservan; los inferiores a `min` o superiores a
 * `max` se sustituyen por el límite correspondiente.
 *
 * @param value - Número que se quiere restringir.
 * @param min - Límite inferior inclusivo.
 * @param max - Límite superior inclusivo. Debe ser mayor o igual que `min`.
 * @returns El valor limitado al intervalo indicado.
 * @throws {RangeError} Si `min` es mayor que `max`, pues el intervalo es inválido.
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError('clamp requires min to be less than or equal to max.');
  }

  return Math.min(Math.max(value, min), max);
}
