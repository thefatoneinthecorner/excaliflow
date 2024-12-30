import { useCallback, useEffect, useRef, useState } from 'react';
import { ExcalidrawArrowElement, ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { ExcalidrawData, Scene } from './types.ts';
import { ScreenshotViewer } from './components/ScreenshotViewer.tsx';
import { ELEMENT_LINK_PREFIX, SceneManager } from './lib/SceneManager.ts';
import { WorkflowViewer } from './components/WorkflowViewer.tsx';
import { Excalidraw, getCommonBounds, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw';
import { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import PptxGenJS from 'pptxgenjs';
import { sceneScale, slideSceneImageProps } from './lib/slideSceneImageProps.ts';
import Flow from './flow.svg';
import { extractTitle } from './lib/extractTitle.tsx';
import rawMarkdown from '../README.md';

/*
Things that weren't obvious
1. An element can be a member of several groups
2. A link can reference an element or a group
3. The default viewer will scroll a target into view, but animates
4. The "workflow" is everything that *isn't* linked to.
5. Elements are immutable, and call updateScene with the modified elements
6. So, you can either hide elements but keep them in the scene, or just redefine the scene.

I think my FlowDiagram should have a set of scenes that I can use equality on. And then a map of all the links
against the scenes.
 */

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

function excalidrawTypeToSlideShape(type: ExcalidrawElement['type']): PptxGenJS.SHAPE_NAME {
  switch (type) {
    case 'diamond':
      return 'diamond';
    case 'ellipse':
      return 'ellipse';
    case 'arrow':
      return 'line';
    case 'rectangle':
    case 'image':
    case 'text':
      return 'rect';
    default:
      throw new Error(`Unsupported type '${type}'`);
  }
}

function ExcaliflowWelcome() {
  return (
    <WelcomeScreen>
      <WelcomeScreen.Center>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* The original SVG */}
          <div>
            <WelcomeScreen.Center.Logo />
          </div>
          <div style={{ paddingLeft: 200 }}>
            <Flow />
          </div>
          {/* Overlay for the strike-through */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none' // Ensure it doesn't interfere with mouse interactions
            }}
          >
            <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
              <line
                x1="180" // Adjust starting point for your text
                y1="30" // Adjust Y position for alignment
                x2="280" // Adjust endpoint for your text
                y2="5" // Adjust Y position for alignment
                stroke="red"
                strokeWidth="3"
              />
            </svg>
          </div>
        </div>
        <p style={{ maxWidth: 400, textAlign: 'center' }}>
          {rawMarkdown.split('###')[1].split('\n')[2]}
          <a
            style={{ pointerEvents: 'all' }}
            href="https://github.com/thefatoneinthecorner/excaliflow?tab=readme-ov-file#overview"
            target="_blank"
          >
            &nbsp;more...
          </a>
        </p>
        <WelcomeScreen.Center.Menu>
          <WelcomeScreen.Center.MenuItemLink href="https://github.com/excalidraw/excalidraw">
            Excalidraw GitHub
          </WelcomeScreen.Center.MenuItemLink>
          <WelcomeScreen.Center.MenuItemLink href="https://github.com/thefatoneinthecorner/excaliflow">
            Excaliflow GitHub
          </WelcomeScreen.Center.MenuItemLink>
          <WelcomeScreen.Center.MenuItemHelp />
        </WelcomeScreen.Center.Menu>
      </WelcomeScreen.Center>
    </WelcomeScreen>
  );
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
    api?.updateScene({ appState: { ...api?.getAppState(), viewModeEnabled: false } });
  };

  useEffect(() => {
    if (!api) return;

    if (mode === 'view') {
      setSceneManager(new SceneManager(structuredClone(api.getSceneElements() as Scene)));
    }

    if (mode === 'edit') {
      setSceneManager(undefined);
    }
  }, [api, mode]);

  useEffect(() => {
    if (!sceneManager) return;

    const { title } = extractTitle(sceneManager.scenesByLink.get(displayLink) || []);

    if (!title || title.type !== 'text') return;

    setTitle(title.text || '');
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

  const addScene = async (scene: Scene, slide: PptxGenJS.Slide, link: string, links: string[], xOffset = 0) => {
    if (!api) return;
    const { scale, marginY, marginX } = sceneScale(scene, xOffset);

    slide.addImage(await slideSceneImageProps(scene, link, api, xOffset));
    const [minX, minY] = getCommonBounds(scene);

    for (const element of scene.filter(({ link }) => link)) {
      const { type, x, y, width, height, link } = element;
      const linkNumber = links.indexOf(link!);
      const shape = {
        // line: {
        //   width: xOffset ? 1.5 : 0,
        //   color: 'FF0000'
        // },
        x: (x - minX) * scale + marginX,
        y: (y - minY) * scale + marginY,
        w: width * scale,
        h: height * scale,
        hyperlink: { slide: linkNumber + 1 }
      };

      slide.addShape(excalidrawTypeToSlideShape(type), shape);
    }
  };

  const exportSlides = async () => {
    if (!api) return;

    const pres = new PptxGenJS();
    const sceneManager = new SceneManager(structuredClone(api.getSceneElements() as Scene))!;
    const { workflowScene } = sceneManager;
    const links = [...sceneManager.scenesByLink.keys()];

    for (const link of links) {
      const screenshot = sceneManager.scenesByLink.get(link);

      if (!screenshot) continue;
      const slide = pres.addSlide();

      await addScene(workflowScene, slide, link, links, workflowOnLeft ? 0 : 5);

      const { scene, title } = extractTitle(screenshot);

      await addScene(scene, slide, link, links, workflowOnLeft ? 5 : 0);

      if (title?.type === 'text') {
        const { text } = title;

        slide.addText(text, {
          y: 0,
          x: 0,
          h: 0.6
        });
      }
    }

    pres.writeFile().then();
  };

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
            <MainMenu.Item onSelect={() => setWorkflowOnLeft((prev) => !prev)}>Swap Sides</MainMenu.Item>
            <MainMenu.Item onSelect={exportSlides}>Export to Slide Deck</MainMenu.Item>
          </MainMenu>
          <ExcaliflowWelcome />
        </Excalidraw>
      </div>
      {title}
      <div style={{ height: '90vh', width: '100vw', display: 'flex' }}>
        {mode === 'view' && sceneManager && excalidrawDrawing && workflowOnLeft && (
          <WorkflowViewer
            excalidrawDrawing={excalidrawDrawing}
            sceneManager={sceneManager}
            displayLink={displayLink}
            setDisplayLink={setDisplayLink}
            revertToEditMode={setEditMode}
          />
        )}
        {mode === 'view' && sceneManager && excalidrawDrawing && (
          <ScreenshotViewer
            excalidrawDrawing={excalidrawDrawing}
            sceneManager={sceneManager}
            displayLink={displayLink}
            setDisplayLink={setDisplayLink}
            revertToEditMode={setEditMode}
          />
        )}
        {mode === 'view' && sceneManager && excalidrawDrawing && !workflowOnLeft && (
          <WorkflowViewer
            excalidrawDrawing={excalidrawDrawing}
            sceneManager={sceneManager}
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
