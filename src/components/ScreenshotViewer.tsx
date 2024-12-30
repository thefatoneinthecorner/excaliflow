import React, { useCallback, useEffect, useState } from 'react';
import { ExcalidrawImperativeAPI, ExcalidrawProps } from '@excalidraw/excalidraw/types/types';
import { Excalidraw, viewportCoordsToSceneCoords } from '@excalidraw/excalidraw';
import { ExcalidrawData } from '../types';
import { SceneManager } from '../lib/SceneManager.ts';
import { extractTitle } from '../lib/extractTitle.tsx';

export function ScreenshotViewer({
  excalidrawDrawing,
  sceneManager,
  displayLink,
  setDisplayLink,
  revertToEditMode
}: {
  excalidrawDrawing: ExcalidrawData;
  sceneManager: SceneManager;
  displayLink?: string;
  setDisplayLink: (linkId: string) => void;
  revertToEditMode: () => void;
}) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI>();

  useEffect(() => {
    function handleKeyChange(ev: KeyboardEvent) {
      if (ev.altKey && ev.code === 'KeyR') {
        revertToEditMode();
      }
    }
    window.addEventListener('keydown', handleKeyChange);
    return () => {
      window.removeEventListener('keydown', handleKeyChange);
    };
  }, [revertToEditMode]);

  const linkOpen = useCallback(
    (element: { link: string | null }, event: { preventDefault: () => void }) => {
      const scene = sceneManager.scenesByLink
        .get(element.link || '')
        ?.map(({ link, customData, ...rest }) => ({ ...rest, link: null, customData: { ...customData, link } }));

      if (!api || !scene || scene.length === 0) return;

      const { title } = extractTitle(scene);

      event.preventDefault();
      setDisplayLink(element.link!);
      api.updateScene({ elements: scene.filter((e) => e !== title) });
      api.scrollToContent(scene, { fitToContent: true, animate: false });
    },
    [api, setDisplayLink, sceneManager.scenesByLink]
  );

  useEffect(() => {
    if (!displayLink) {
      if (sceneManager.scenesByLink.size > 0) {
        setDisplayLink(Array.from(sceneManager.scenesByLink.keys())[0]);
      }
    }

    if (displayLink) {
      // todo - not sure why this is required, it seems that you cannot updateScene immediately after the
      //  Excalidraw component has been created. Hmmm
      setTimeout(
        () =>
          linkOpen(
            { link: displayLink },
            {
              preventDefault: () => {}
            }
          ),
        0
      );
    }
  }, [displayLink, linkOpen, sceneManager.scenesByLink, setDisplayLink]);

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
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
        const { link } = customData;
        console.log(new Date().getTime(), link, clientX, clientY, coords.x, coords.y);

        setDisplayLink(link!);
      }
    }
  };

  const onChange: ExcalidrawProps['onChange'] = (_, appState) => {
    if (!appState.viewModeEnabled) {
      revertToEditMode();
    }
  };

  return (
    <div className="viewer" style={{ height: '100vh', width: '100vw' }} onPointerDown={onPointerDown}>
      <style>{'footer {display: none}'}</style>
      <Excalidraw
        excalidrawAPI={(api) => setApi(api)}
        initialData={{
          ...excalidrawDrawing,
          elements: [],
          appState: { viewModeEnabled: true }
        }}
        onLinkOpen={linkOpen}
        onChange={onChange}
      />
    </div>
  );
}
