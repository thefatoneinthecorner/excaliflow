import { Excalidraw, viewportCoordsToSceneCoords } from '@excalidraw/excalidraw';
import React, { useEffect, useState } from 'react';
import { ExcalidrawImperativeAPI, ExcalidrawProps } from '@excalidraw/excalidraw/types/types';
import { SceneManager } from '../lib/SceneManager.ts';
import { NonDeletedExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { ExcalidrawData } from '../types.ts';

interface WorkflowViewerProps {
  sceneManager: SceneManager;
  excalidrawDrawing: ExcalidrawData;
  displayLink: string;
  setDisplayLink: (link: string) => void;
  revertToEditMode: () => void;
}

export function WorkflowViewer({
  sceneManager,
  excalidrawDrawing,
  displayLink,
  setDisplayLink,
  revertToEditMode
}: WorkflowViewerProps) {
  const [excalidrawApi, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI>();

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

  useEffect(() => {
    if (!sceneManager || !excalidrawApi) return;

    const elements = sceneManager.workflowScene;

    setTimeout(() => {
      excalidrawApi.scrollToContent(elements, { fitToContent: true, animate: false });
      // setVisible(true);
    }, 50);

    console.log('Installing onPointer callbacks');
    const unsub = excalidrawApi.onPointerDown((...e) => console.log('onPointerDown', e));
    excalidrawApi.onPointerUp((...e) => console.log('onPointerUp', e));
    console.log('Installing onPointer callbacks', unsub);
  }, [excalidrawApi, excalidrawDrawing.elements, sceneManager]);

  useEffect(() => {
    // highlight any elements in the workflow that reference the same scene as that identified by linkId
    if (!sceneManager || !excalidrawApi) return;

    const screenshotScene = sceneManager.scenesByLink.get(displayLink);

    if (!screenshotScene) return;

    // for reasons I don't understand, the sceneManager.workflowScene does not include text baselines, whereas
    // the actual scene elements do. Without the baseline all the text disappears.
    const elements = excalidrawApi.getSceneElements().map((e) => {
      if (!e.customData?.link) return e;

      if (sceneManager.scenesByLink.get(e.customData.link) === screenshotScene) {
        return {
          ...e,
          strokeColor: 'red',
          strokeWidth: 6,
          customData: { ...e.customData, strokeColor: e.strokeColor, strokeWidth: e.strokeWidth }
        };
      }

      return { ...e, strokeWidth: e?.customData.strokeWidth, strokeColor: e?.customData.strokeColor };
    });

    // todo - not sure why this is required, it seems that you cannot updateScene immediately after the
    //  Excalidraw component has been created. Hmmm
    setTimeout(() => excalidrawApi.updateScene({ elements }), 0);
  }, [displayLink, excalidrawApi, sceneManager]);

  const linkOpen = (
    element: NonDeletedExcalidrawElement,
    event: CustomEvent<{
      nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
    }>
  ) => {
    const { link } = element;

    event.preventDefault();

    if (!link) return;

    setDisplayLink(link);
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!excalidrawApi) return;
    const { clientX, clientY } = e;
    const coords = viewportCoordsToSceneCoords(
      // todo - figure out why I need to subtract these 10 pixels
      { clientX, clientY: clientY - 10 },
      excalidrawApi.getAppState()
    );

    for (const element of excalidrawApi.getSceneElements().filter(({ customData }) => customData?.link)) {
      const { x, y, width, height, customData } = element;
      const isInside = x < coords.x && coords.x < x + width && y < coords.y && coords.y < y + height;

      if (isInside && customData?.link) {
        const { link } = customData;

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
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          ...excalidrawDrawing,
          elements: sceneManager.workflowScene.map(({ link, customData, ...rest }) => ({
            ...rest,
            link: null,
            customData: { ...customData, link }
          })),
          appState: {
            viewModeEnabled: true
          }
        }}
        onLinkOpen={linkOpen}
        onChange={onChange}
      />
    </div>
  );
}
