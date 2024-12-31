import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import PptxGenJS from 'pptxgenjs';
import { SceneManager } from './SceneManager.ts';
import { Scene } from '../types.ts';
import { extractTitle } from './extractTitle.tsx';
import { sceneScale, slideSceneImageProps } from './slideSceneImageProps.ts';
import { getCommonBounds } from '@excalidraw/excalidraw';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

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

const addScene = async (
  api: ExcalidrawImperativeAPI,
  scene: Scene,
  slide: PptxGenJS.Slide,
  link: string,
  links: string[],
  xOffset = 0
) => {
  if (!api) return;
  const { scale, marginY, marginX } = sceneScale(scene, xOffset);

  slide.addImage(await slideSceneImageProps(scene, link, api, xOffset));
  const [minX, minY] = getCommonBounds(scene);

  for (const element of scene.filter(({ link }) => link)) {
    const { type, x, y, width, height, link } = element;
    const linkNumber = links.indexOf(link!);
    const shape = {
      x: (x - minX) * scale + marginX,
      y: (y - minY) * scale + marginY,
      w: width * scale,
      h: height * scale,
      hyperlink: { slide: linkNumber + 1 }
    };

    slide.addShape(excalidrawTypeToSlideShape(type), shape);
  }
};

export const exportAsSlides = async (api: ExcalidrawImperativeAPI | undefined, workflowOnLeft: boolean) => {
  if (!api) return;

  const pres = new PptxGenJS();
  const sceneManager = new SceneManager(structuredClone(api.getSceneElements() as Scene))!;
  const { workflowScene } = sceneManager;
  const links = [...sceneManager.scenesByLink.keys()];

  for (const link of links) {
    const screenshot = sceneManager.scenesByLink.get(link);

    if (!screenshot) continue;
    const slide = pres.addSlide();

    await addScene(api, workflowScene, slide, link, links, workflowOnLeft ? 0 : 5);

    const { scene, title } = extractTitle(screenshot);

    await addScene(api, scene, slide, link, links, workflowOnLeft ? 5 : 0);

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
