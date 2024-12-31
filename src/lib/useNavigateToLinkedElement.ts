import React, { useCallback } from 'react';
import { viewportCoordsToSceneCoords } from '@excalidraw/excalidraw';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';

/** returns an event handler which locates the clicked element and, if linked, sets the displayLink accordingly */
export function useNavigateToLinkedElement(
  api: ExcalidrawImperativeAPI | undefined,
  setDisplayLink: React.Dispatch<React.SetStateAction<string>>
) {
  const displayLinkedElement: React.PointerEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (!api) return;
      const { clientX, clientY } = e;
      const coords = viewportCoordsToSceneCoords(
        // todo - figure out why I need to subtract these 10 pixels
        { clientX, clientY: clientY - 10 },
        api.getAppState()
      );

      for (const element of api.getSceneElements().filter(({ customData }) => customData?.link)) {
        const { x, y, width, height, customData } = element;
        const isInside = x < coords.x && coords.x < x + width && y < coords.y && coords.y < y + height;

        if (isInside && customData?.link) {
          setDisplayLink(customData.link);
        }
      }
    },
    [api, setDisplayLink]
  );

  return {
    navigate: displayLinkedElement
  };
}
