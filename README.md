# Visual Motion Engine

Visual Motion Engine (VME) is a React and TypeScript motion architecture for building interactive visual interfaces from reusable physical and visual signals.

It separates input capture, motion analysis, visual transformation, shared React state, and rendering. The current implementation includes the foundational motion system and the first renderer, `InteractiveVideo`.

## Goal

VME provides a stable foundation for interfaces that react to pointer movement with smooth, frame-rate-independent motion. The same motion frame can be consumed by different renderers without duplicating input, timing, or smoothing logic.

## Features

- Strict TypeScript project powered by Vite and React.
- Pure mathematical utilities: `clamp`, `lerp`, and frame-rate-independent `damp`.
- DOM-independent `MousePhysics` for position, velocity, acceleration, and timing signals.
- Renderer-independent `MotionEngine` that transforms `MotionInput` into visual values.
- Shared `MotionProvider` that owns one `MotionEngine`, input handling, animation timing, and the current `MotionFrame`.
- `useMotionFrame()` for renderer components that only need resolved visual state.
- `InteractiveVideo`, which applies translation, rotation, scale, and float offset through CSS transforms.
- No video timeline scrubbing in the current implementation.

## Architecture

VME is organized as a unidirectional pipeline:

```text
Browser input
  → useMouse
  → MousePhysics
  → MotionInput
  → MotionEngine
  → MotionFrame
  → useMotionFrame
  → renderer component
```

`MotionProvider` owns the React-specific portion of this pipeline. Renderer components do not calculate physics, manage animation loops, or update the engine directly.

### MotionEngine

`MotionEngine` is a pure TypeScript class with no dependency on React, the DOM, or a specific renderer. It receives a `MotionInput` on every update and produces a `MotionFrame` containing:

- `rotation`
- `translation`
- `scale`
- `opacity`
- `floatOffset`
- `energy`
- `velocity`
- `speed`
- `direction`

Its visual response is configurable through rotation, translation, scale, float, energy, and damping parameters. Calculations use `clamp`, `lerp`, and exponential `damp` to keep the result bounded and independent of frame rate.

### MotionProvider

`MotionProvider` is the React integration boundary. It creates one `MotionEngine` instance for its subtree, uses `useMouse` for input, updates the engine with `useAnimationFrame`, and exposes the latest `MotionFrame` through context.

Both `useMotionEngine()` and `useMotionFrame()` must be called inside a `MotionProvider`. They throw an explicit error outside that provider.

### MotionInput

`MotionInput` is the renderer-agnostic contract consumed by `MotionEngine`. It contains only processed motion data:

- `velocity`
- `smoothedVelocity`
- `acceleration`
- `speed`
- `direction`
- `deltaTime`

This contract keeps the visual engine independent from the source of motion data.

## Project Structure

```text
src/
├── components/
│   └── InteractiveVideo/
│       ├── InteractiveVideo.css
│       ├── InteractiveVideo.tsx
│       ├── InteractiveVideo.types.ts
│       └── index.ts
├── core/
│   ├── MotionEngine.ts
│   ├── MotionInput.ts
│   └── MousePhysics.ts
├── hooks/
│   ├── useAnimationFrame.ts
│   ├── useMouse.ts
│   └── useVelocity.ts
├── providers/
│   ├── MotionProvider.tsx
│   └── index.ts
├── utils/
│   ├── clamp.ts
│   ├── damp.ts
│   └── lerp.ts
├── App.tsx
└── main.tsx
```

## Installation

VME is currently used from this repository source; it is not published as an npm package.

```bash
git clone https://github.com/htellezv/visual-motion-engine.git
cd visual-motion-engine
npm install
```

Run the development environment with:

```bash
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Usage

Wrap interactive renderers in `MotionProvider`. This gives every descendant access to the shared motion frame.

```tsx
import { InteractiveVideo } from './components/InteractiveVideo';
import { MotionProvider } from './providers';

export function ProductVisual() {
  return (
    <MotionProvider>
      <div style={{ width: 640, height: 360 }}>
        <InteractiveVideo
          videoUrl="/media/product.mp4"
          className="product-visual"
        />
      </div>
    </MotionProvider>
  );
}
```

`InteractiveVideo` renders a muted, inline video with `object-fit: cover` and applies its motion only through `translate3d`, `rotateX`, `rotateY`, and `scale` CSS transforms.

## React Example

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { InteractiveVideo } from './components/InteractiveVideo';
import { MotionProvider } from './providers';

function App() {
  return (
    <MotionProvider>
      <main style={{ width: '100vw', height: '100vh' }}>
        <InteractiveVideo videoUrl="/media/scene.mp4" />
      </main>
    </MotionProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

## Roadmap

The repository currently contains the base motion architecture and `InteractiveVideo`. No additional roadmap items are committed in the codebase at this time.

## Contributing

Contributions are welcome. Before opening a pull request:

1. Keep the separation between core motion logic, React integration, and renderers intact.
2. Preserve strict TypeScript compatibility.
3. Run `npm run build` successfully.
4. Keep changes scoped and document architectural decisions in the pull request description.

## License

MIT License.
