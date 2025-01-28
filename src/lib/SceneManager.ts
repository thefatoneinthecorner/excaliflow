import { Scene } from '../types.ts';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import assert from 'assert';

export const ELEMENT_LINK_PREFIX = 'https://excalidraw.com/?element=';

/* Removes the link (to suppress the annoying "link" icon) and preserves the stroke (and link) in the element's
   customData to revert to after highlighting. The link functionality is replaced with useNavigateToLinkedElement().
*/
function stripLinkAndPreserveStroke({ link, strokeWidth, strokeColor, ...rest }: ExcalidrawElement) {
  return { ...rest, link: null, strokeWidth, strokeColor, customData: { link, strokeWidth, strokeColor } };
}

export class SceneManager {
  public readonly workflowScene: Scene;

  public readonly scenesByLink = new Map<string, Scene>();

  constructor(rawElements: Scene) {
    const elements = this.normaliseToGroupLinks(rawElements);

    // create an empty scene for each link
    for (const { link } of elements) {
      if (link) this.scenesByLink.set(link, []);
    }

    // populate each scene
    for (const link of this.scenesByLink.keys()) {
      if (!link.startsWith(ELEMENT_LINK_PREFIX)) continue;

      const linkId = link.slice(ELEMENT_LINK_PREFIX.length);
      const element = elements.find(({ id }) => id === linkId);
      const groupIds = element ? element.groupIds : [linkId];
      const scene = [] as Scene;

      groupIds.forEach((groupId) => scene.push(...elements.filter(({ groupIds }) => groupIds.includes(groupId))));

      this.scenesByLink.set(link, scene);
    }

    // any element not in a scene is in the workflowScene
    const sceneElements = new Set(Array.from(this.scenesByLink.values()).flat());

    this.workflowScene = elements.filter((e) => !sceneElements.has(e)).map(stripLinkAndPreserveStroke);
    this.normaliseScenes();
  }

  /** replace links to elements with links to the largest group they belong to */
  private normaliseToGroupLinks(raw: Scene) {
    const elementsByLink = new Map<string, ExcalidrawElement>(raw.map((e) => [`${ELEMENT_LINK_PREFIX}${e.id}`, e]));
    const groupIds = [...new Set<string>(raw.flatMap(({ groupIds }) => groupIds))];
    const groupCompositions = new Map<string, Scene>(groupIds.map((g) => [g, []]));

    raw.forEach((e) => e.groupIds.forEach((g) => groupCompositions.get(g)?.push(e)));

    const largestGroup = (groups: readonly string[]) => {
      const maxSize = Math.max(...groups.map((g) => groupCompositions.get(g)!.length));

      return groups.find((g) => groupCompositions.get(g)!.length >= maxSize)!;
    };

    return raw.map((e) => {
      if (!e.link) return e;

      // link to an element id
      if (elementsByLink.has(e.link)) {
        const target = elementsByLink.get(e.link)!;

        if (target.groupIds.length > 0) {
          return {
            ...e,
            link: `${ELEMENT_LINK_PREFIX}${largestGroup(target.groupIds)}`
          };
        }
      }

      // link to a group id
      if (groupCompositions.has(e.link.slice(ELEMENT_LINK_PREFIX.length))) {
        const target = groupCompositions.get(e.link.slice(ELEMENT_LINK_PREFIX.length))![0];

        if (target.groupIds.length > 0) {
          return {
            ...e,
            link: `${ELEMENT_LINK_PREFIX}${largestGroup(target.groupIds)}`
          };
        }
      }

      return e;
    });
  }

  normaliseScenes() {
    const scenesByKey = new Map<string, Scene>();
    const sceneKey = (scene: Scene) => {
      return scene
        .map(({ id }) => id)
        .sort()
        .join('-');
    };

    for (const scene of this.scenesByLink.values()) {
      scenesByKey.set(sceneKey(scene), scene);
    }

    for (const [linkId, scene] of this.scenesByLink.entries()) {
      const normalised = scenesByKey.get(sceneKey(scene));

      assert(normalised, 'Expected to find a normalised scene');
      this.scenesByLink.set(linkId, normalised.map(stripLinkAndPreserveStroke));
    }
  }
}
