import { createContext, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MotionEngine } from '../core/MotionEngine';
import type { MotionFrame } from '../core/MotionEngine';
import type { MotionInput } from '../core/MotionInput';
import type { MouseVector } from '../core/MousePhysics';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useMouse } from '../hooks/useMouse';

interface MotionProviderProps {
  readonly children: ReactNode;
}

const MotionEngineContext = createContext<MotionEngine | null>(null);
const MotionFrameContext = createContext<MotionFrame | null>(null);

function createMotionInput(velocity: MouseVector, acceleration: MouseVector, deltaTime: number): MotionInput {
  const speed = Math.hypot(velocity.x, velocity.y);

  return {
    velocity,
    smoothedVelocity: velocity,
    acceleration,
    speed,
    direction: speed === 0
      ? { x: 0, y: 0 }
      : { x: velocity.x / speed, y: velocity.y / speed },
    deltaTime,
  };
}

export function MotionProvider({ children }: MotionProviderProps) {
  const engineReference = useRef<MotionEngine | null>(null);

  if (engineReference.current === null) {
    engineReference.current = new MotionEngine();
  }

  const engine = engineReference.current;
  const { velocity, acceleration } = useMouse();
  const [frame, setFrame] = useState<MotionFrame>(() => engine.getFrame());

  useAnimationFrame(({ deltaTime }) => {
    setFrame(engine.update(createMotionInput(velocity, acceleration, deltaTime)));
  });

  return (
    <MotionEngineContext.Provider value={engine}>
      <MotionFrameContext.Provider value={frame}>
        {children}
      </MotionFrameContext.Provider>
    </MotionEngineContext.Provider>
  );
}

export function useMotionEngine(): MotionEngine {
  const engine = useContext(MotionEngineContext);

  if (engine === null) {
    throw new Error('useMotionEngine must be used within a MotionProvider.');
  }

  return engine;
}

export function useMotionFrame(): MotionFrame {
  const frame = useContext(MotionFrameContext);

  if (frame === null) {
    throw new Error('useMotionFrame must be used within a MotionProvider.');
  }

  return frame;
}
