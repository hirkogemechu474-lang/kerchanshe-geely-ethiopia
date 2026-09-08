// `<model-viewer>` (from @google/model-viewer) is a custom HTML element, not
// a built-in React/HTML tag, so TypeScript/JSX don't know its attributes
// without this declaration.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  poster?: string;
  'camera-controls'?: boolean;
  'auto-rotate'?: boolean;
  'auto-rotate-delay'?: number | string;
  'rotation-per-second'?: string;
  'interaction-prompt'?: string;
  'shadow-intensity'?: string | number;
  exposure?: string | number;
  'environment-image'?: string;
  ar?: boolean;
  loading?: 'auto' | 'lazy' | 'eager';
  reveal?: 'auto' | 'interaction' | 'manual';
};

// React 19's JSX namespace lives under `React.JSX`, not the bare global
// `JSX` namespace, so the augmentation has to target the "react" module.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}

export {};
