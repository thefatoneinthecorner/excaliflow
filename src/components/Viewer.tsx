import { Excalidraw } from '@excalidraw/excalidraw';
import { useState } from 'react';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { ExcalidrawData } from '../types.ts';
import { useRevertToEditMode } from '../lib/useRevertToEditMode.ts';
import { useNavigateToLinkedElement } from '../lib/useNavigateToLinkedElement.ts';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { useHighlightedContent } from '../lib/useHighlightedContent.ts';

interface WorkflowViewerProps {
  elements: ExcalidrawElement[];
  excalidrawDrawing: ExcalidrawData;
  displayLink: string;
  setDisplayLink: (lnk: string) => void;
  revertToEditMode: () => void;
}

export function Viewer({
  elements,
  excalidrawDrawing,
  displayLink,
  setDisplayLink,
  revertToEditMode
}: WorkflowViewerProps) {
  const [excalidrawApi, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI>();
  const { revertToEditModeOnLeavingViewMode } = useRevertToEditMode(revertToEditMode);
  const { navigate } = useNavigateToLinkedElement(excalidrawApi, setDisplayLink);

  useHighlightedContent({ excalidrawApi, displayLink, elements });

  return (
    <div className="viewer" style={{ height: '100vh', width: '50vw' }} onPointerDown={navigate}>
      <Excalidraw
        excalidrawAPI={setExcalidrawAPI}
        initialData={{
          ...excalidrawDrawing,
          elements
        }}
        onChange={(elements, appState, files) => revertToEditModeOnLeavingViewMode(elements, appState, files)}
      />
    </div>
  );
}
