export interface InteractiveVideoProps {
  readonly videoUrl: string;
  readonly rotationIntensity?: number;
  readonly translationIntensity?: number;
  readonly scaleIntensity?: number;
  readonly floatAmplitude?: number;
  readonly floatSpeed?: number;
  readonly className?: string;
}
