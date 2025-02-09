import { useCallback, useEffect, useRef, useState } from 'react';
import { ExcalidrawArrowElement } from '@excalidraw/excalidraw/types/element/types';
import { ExcalidrawData, Scene } from './types.ts';
import { ELEMENT_LINK_PREFIX, SceneManager } from './lib/SceneManager.ts';
import { Viewer } from './components/Viewer.tsx';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { extractTitle } from './lib/extractTitle.tsx';
import { ExcaliflowWelcome } from './components/ExcaliflowWelcome.tsx';
import { exportAsSlides } from './lib/exportAsSlides.ts';

/*
Things that weren't obvious
1. An element can be a member of several groups
2. A link can reference an element or a group
3. The default viewer will scroll a target into view, but animates
4. The "workflow" is everything that *isn't* linked to.
5. Elements are immutable, and call updateScene with the modified elements
6. So, you can either hide elements but keep them in the scene, or just redefine the scene.
 */

const ExchangeIcon = <img src={'repeat-solid.svg'} alt="Exchange" width="16" height="16" />;

const ExportIcon = <img src={'file-export-solid.svg'} alt="Export" width="16" height="16" />;

function useAltKeyDepressed() {
  const alt = useRef<boolean>();

  const onKeyChange = (e: KeyboardEvent) => {
    if (e.key !== 'Alt') return;

    alt.current = e.getModifierState('Alt');
  };

  useEffect(() => {
    window.addEventListener('keyup', onKeyChange);
    window.addEventListener('keydown', onKeyChange);

    return () => {
      window.removeEventListener('keyup', onKeyChange);
      window.removeEventListener('keydown', onKeyChange);
    };
  }, []);

  return useCallback(() => {
    return alt.current;
  }, [alt]);
}

function App() {
  const [excalidrawDrawing, setExcalidrawDrawing] = useState<Readonly<ExcalidrawData>>();
  const [sceneManager, setSceneManager] = useState<SceneManager>();
  const [displayLink, setDisplayLink] = useState('');
  const [mode, setMode] = useState<'view' | 'edit'>('edit');
  const [api, setApi] = useState<ExcalidrawImperativeAPI>();
  const isAltKeyDepressed = useAltKeyDepressed();
  const [workflowOnLeft, setWorkflowOnLeft] = useState(true);
  const [title, setTitle] = useState('');

  const setEditMode = () => {
    setMode('edit');
    api?.updateScene({ appState: { ...api?.getAppState(), viewModeEnabled: false, zenModeEnabled: false } });
  };

  useEffect(() => {
    if (!api) return;

    if (mode === 'view') {
      const sm = new SceneManager(structuredClone(api.getSceneElements() as Scene));
      setDisplayLink(sm.scenesByLink.keys().next().value || '');
      setSceneManager(sm);
    }

    if (mode === 'edit') {
      setSceneManager(undefined);
    }
  }, [api, mode]);

  useEffect(() => {
    if (!sceneManager) return;

    const { title } = extractTitle(sceneManager.scenesByLink.get(displayLink) || []);

    setTitle(title?.text || '');
  }, [sceneManager, displayLink]);

  const maybeConvertArrowToLink = useCallback(
    (appState: Readonly<AppState>) => {
      if (!isAltKeyDepressed() || !api) return;

      const selection = appState.selectedElementIds;
      const scene = api.getSceneElements();
      const selectedElements = scene.filter(({ id }) => selection[id]);

      if (!selectedElements.every((e) => e.type === 'arrow' && e.startBinding?.elementId && e.endBinding?.elementId))
        return;

      const arrows = selectedElements as ExcalidrawArrowElement[];

      for (const { id, startBinding, endBinding } of arrows) {
        api.updateScene({
          elements: api
            .getSceneElements()
            .filter((arrow) => arrow.id !== id)
            .map((e) =>
              e.id === startBinding!.elementId ? { ...e, link: `${ELEMENT_LINK_PREFIX}${endBinding!.elementId}` } : e
            )
        });
      }
    },
    [api, isAltKeyDepressed]
  );

  const onChange = useCallback(() => {
    if (!api) return;
    const appState = api.getAppState();

    setMode((prev) => {
      if (prev === 'edit' && appState.viewModeEnabled) {
        setExcalidrawDrawing({
          elements: [...api.getSceneElements()],
          appState: api.getAppState(),
          files: api.getFiles()
        });
      }
      return appState.viewModeEnabled ? 'view' : 'edit';
    });

    maybeConvertArrowToLink(appState);
  }, [api, maybeConvertArrowToLink]);

  return (
    <>
      <div
        style={{
          height: mode === 'edit' ? '100vh' : 0,
          width: '100vw',
          visibility: mode === 'edit' ? 'visible' : 'hidden'
        }}
      >
        <Excalidraw excalidrawAPI={(api) => setApi(api)} initialData={excalidrawDrawing} onChange={onChange}>
          <MainMenu>
            <MainMenu.DefaultItems.LoadScene />
            <MainMenu.DefaultItems.SaveToActiveFile />
            <MainMenu.DefaultItems.ToggleTheme />
            <MainMenu.DefaultItems.Export />
            <MainMenu.Item icon={ExchangeIcon} onSelect={() => setWorkflowOnLeft((prev) => !prev)}>
              Swap Sides
            </MainMenu.Item>
            <MainMenu.Item icon={ExportIcon} onSelect={() => exportAsSlides(api, workflowOnLeft)}>
              Export as Slide Deck
            </MainMenu.Item>
          </MainMenu>
          <ExcaliflowWelcome />
        </Excalidraw>
      </div>
      {title}
      <div style={{ height: '90vh', width: '100vw', display: 'flex' }}>
        {mode === 'view' && sceneManager && excalidrawDrawing && workflowOnLeft && (
          <Viewer
            excalidrawDrawing={excalidrawDrawing}
            elements={sceneManager.workflowScene}
            displayLink={displayLink}
            setDisplayLink={setDisplayLink}
            revertToEditMode={setEditMode}
          />
        )}
        {mode === 'view' && sceneManager && excalidrawDrawing && (
          <Viewer
            excalidrawDrawing={excalidrawDrawing}
            elements={extractTitle(sceneManager?.scenesByLink.get(displayLink) || []).scene}
            displayLink={displayLink}
            setDisplayLink={setDisplayLink}
            revertToEditMode={setEditMode}
          />
        )}
        {mode === 'view' && sceneManager && excalidrawDrawing && !workflowOnLeft && (
          <Viewer
            excalidrawDrawing={excalidrawDrawing}
            elements={sceneManager.workflowScene}
            displayLink={displayLink}
            setDisplayLink={setDisplayLink}
            revertToEditMode={setEditMode}
          />
        )}
      </div>
    </>
  );
}

export default App;
