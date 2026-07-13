import { useMotionFrame } from '../../providers';
import './InteractiveVideo.css';
import type { InteractiveVideoProps } from './InteractiveVideo.types';

export function InteractiveVideo({ videoUrl, className }: InteractiveVideoProps) {
  const frame = useMotionFrame();
  const transform = [
    `translate3d(${frame.translation.x}px, ${frame.translation.y + frame.floatOffset}px, 0)`,
    `rotateX(${frame.rotation.x}deg)`,
    `rotateY(${frame.rotation.y}deg)`,
    `scale(${frame.scale})`,
  ].join(' ');
  const rootClassName = className === undefined
    ? 'vme-interactive-video'
    : `vme-interactive-video ${className}`;

  return (
    <div className={rootClassName} style={{ transform }}>
      <video
        className="vme-interactive-video__media"
        src={videoUrl}
        playsInline
        muted
        preload="auto"
      />
    </div>
  );
}
