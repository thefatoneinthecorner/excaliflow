import { Scene } from '../types.ts';
import { getCommonBounds } from '@excalidraw/excalidraw';

export function extractTitle(scene: Scene) {
  // if the top left element is a  text element
  const [minX, minY] = getCommonBounds(scene);

  for (const text of scene.filter(({ type }) => type === 'text')) {
    const { x, y } = text;

    if (x === minX && y === minY)
      return {
        title: text,
        scene: scene.filter((e) => e !== text)
      };
  }

  return { scene };
}
