import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

export interface ExcalidrawData {
  elements: ExcalidrawElement[];
  appState: object;
  files?: Record<string, any>;
}

export type Scene = ExcalidrawElement[];
