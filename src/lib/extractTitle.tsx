import { Scene } from '../types.ts';
import { getCommonBounds } from '@excalidraw/excalidraw';
import { ExcalidrawTextElement } from '@excalidraw/excalidraw/types/element/types';

/** split a scene into a title and the remainder. The (optional) title is the top left element */
export function extractTitle(scene: Scene): { scene: Scene; title?: ExcalidrawTextElement } {
  // if the top left element is a  text element
  const [minX, minY] = getCommonBounds(scene);

  for (const text of scene.filter(({ type }) => type === 'text')) {
    const { x, y, type } = text;

    if (x === minX && y === minY && type === 'text')
      return {
        title: text,
        scene: scene.filter((e) => e !== text)
      };
  }

  return { scene, title: undefined };
}
