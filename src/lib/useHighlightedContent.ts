/* Highlights the current displayLink element and ensures that the workflow is correctly zoomed */
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { useEffect } from 'react';

/** highlights any elements linked to the given displayLink */
export function useHighlightedContent({
  excalidrawApi,
  displayLink,
  elements: scene,
  autoScroll
}: {
  excalidrawApi?: ExcalidrawImperativeAPI;
  displayLink: string;
  elements: ExcalidrawElement[];
  autoScroll: boolean;
}) {
  useEffect(() => {
    if (!excalidrawApi) return () => {};

    const elements = scene.map(function highlightDisplayLink(r: ExcalidrawElement) {
      // NB: these properties are initialised by stripLinkAndPreserveStroke() below
      const { link, strokeColor, strokeWidth } = r.customData || {};

      if (link !== displayLink) return { ...r, strokeColor, strokeWidth };

      return { ...r, strokeColor: 'red', strokeWidth: 6 };
    });

    const timeout = setTimeout(() => {
      excalidrawApi.updateScene({ elements });
      if (autoScroll) {
        excalidrawApi.scrollToContent(elements, { fitToContent: true, animate: false });
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [excalidrawApi, displayLink, scene, autoScroll]);
}
