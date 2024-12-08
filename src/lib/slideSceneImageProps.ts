import { exportToBlob, getCommonBounds } from '@excalidraw/excalidraw';
import { Scene } from '../types.ts';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import PptxGenJS from 'pptxgenjs';
import ImageProps = PptxGenJS.ImageProps;

function convertBlobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString() || ''); // Base64 string is in `reader.result`
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob); // Read the blob as a Data URL (Base64 string)
  });
}

export function sceneScale(scene: Scene, xOffset = 0) {
  const marginTop = 200;
  const marginBottom = 0;
  const slideWidth = 1920;
  const panelWidth = slideWidth / 2;
  const slideHeight = 1080;
  const panelHeight = slideHeight - marginTop - marginBottom;
  const panelAspectRatio = panelWidth / panelHeight;
  const [minX, minY, maxX, maxY] = getCommonBounds(scene);
  const imageWidth = maxX - minX;
  const imageHeight = maxY - minY;
  const imageAspectRatio = imageWidth / imageHeight;
  let scale;

  if (panelAspectRatio > imageAspectRatio) {
    // make the image height fill the panel height whilst preserving the aspect ratio
    scale =
      ((5.52 * ((slideHeight - marginTop - marginBottom) / slideHeight)) / panelHeight) * (panelHeight / imageHeight);
  } else {
    scale = ((10 * 0.5) / panelWidth) * (panelWidth / imageWidth);
  }

  const w = imageWidth * scale;
  const h = imageHeight * scale;

  return { scale, marginX: (10 * 0.5 - w) / 2 + xOffset, marginY: (5.52 - h) / 2 };
}

export async function slideSceneImageProps(
  scene: Scene,
  displayLink: string,
  api: ExcalidrawImperativeAPI,
  xOffset = 0
) {
  const blob = await exportToBlob({
    elements: scene.map((e) => {
      if (e.link === displayLink) {
        return {
          ...e,
          strokeColor: 'red',
          strokeWidth: 6,
          customData: { strokeColor: e.strokeColor, strokeWidth: e.strokeWidth }
        };
      }

      return e;
    }),
    appState: api.getAppState(),
    files: api.getFiles()
  });

  const [minX, minY, maxX, maxY] = getCommonBounds(scene);
  const imageWidth = maxX - minX;
  const imageHeight = maxY - minY;
  const { scale, marginX, marginY } = sceneScale(scene, xOffset);
  const h = imageHeight * scale;
  const w = imageWidth * scale;

  return {
    data: await convertBlobToBase64(blob),
    w,
    h,
    x: marginX,
    y: marginY
  } as Partial<ImageProps>;
}
