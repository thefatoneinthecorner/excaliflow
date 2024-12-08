import React, { useEffect, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import assert from 'assert';
import { ExcalidrawElement, NonDeletedExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

const ELEMENT_LINK_PREFIX = 'https://excalidraw.com/?element=';

class DefaultMap<K, V> extends Map<K, V> {
  private readonly defaultFn: (key: K) => V;

  constructor(defaultFn: (key: K) => V = () => [] as V, entries?: readonly (readonly [K, V])[] | null) {
    super(entries);
    this.defaultFn = defaultFn;
  }

  get(key: K): V {
    if (!this.has(key)) {
      const defaultValue = this.defaultFn(key);

      assert(defaultValue, 'The DefaultMap defaultFn is expected to return a truthy value');
      this.set(key, defaultValue);
      return defaultValue;
    }
    return super.get(key)!; // Non-null assertion since `has` check ensures this.
  }
}

interface ExcalidrawData {
  elements: ExcalidrawElement[];
  appState: object;
  files?: Record<string, any>;
}

/*
Screenshots are linked together to form a closed graph. The Workflow has elements that are linked to Screenshots.
When a Screenshot is displayed the Workflow is rendered with links to the current Screenshot suitably highlighted.
The Workflow is just all the elements in an Excalidraw file *excluding* the Screenshots. A Screenshot is an element
group where there is at least one element with a link, and all links reference another image element.
 */
class ExcalidrawFlowDiagram {
  private readonly workflow: ExcalidrawElement[];

  private screenshotGroupings = new Map<string, ExcalidrawElement[]>();

  constructor(elements: ExcalidrawElement[]) {
    const elementsById = new Map<string, ExcalidrawElement>(elements.map((e) => [e.id, e]));
    const elementGroupings = new DefaultMap<string, ExcalidrawElement[]>();

    elements.forEach((element: ExcalidrawElement) =>
      element.groupIds.forEach((id) => elementGroupings.get(id).push(element))
    );

    console.log({ elementGroupings });
    // Any elements in groups that are *not* targeted by a link are workflow elements
    const workflowElements = new Map(elementsById);

    const targetSet = new Set<string>();

    elements.forEach(({ link }) => {
      if (!link) return;
      if (!link.startsWith(ELEMENT_LINK_PREFIX)) return;
      const linkId = link.slice(ELEMENT_LINK_PREFIX.length);
      const element = elementsById.get(linkId);

      if (element) {
        targetSet.add(element.id);
        return;
      }

      const group = elementGroupings.get(linkId);

      if (group) {
        group.forEach((element) => targetSet.add(element.id));
        return;
      }

      console.error(`Odd link spec, apparently not an element id nor a group id: ${link}`);
    });

    // const targets = Array.from(
    //   elements.map((e) => e.link?.slice(ELEMENT_LINK_PREFIX.length)).filter((id) => id)
    // ) as string[];
    const targets = Array.from(targetSet.values());

    // remove the target *and all elements in the target group* from workflowElements
    targets
      .map((id) => elementsById.get(id))
      .forEach((element) => {
        assert(element);

        // remove the targeted element ...
        workflowElements.delete(element.id);
        // ... and any elements in the same group
        element.groupIds.forEach((id) => elementGroupings.get(id).forEach((e) => workflowElements.delete(e.id)));
      });

    this.workflow = Array.from(workflowElements.values());

    this.screenshotGroupings = new Map<string, ExcalidrawElement[]>(elementGroupings);
    this.workflow.forEach((e) => e.groupIds.forEach((id) => this.screenshotGroupings.delete(id)));
  }

  getScreenshotGroup(id: string): ExcalidrawElement[] {
    return this.screenshotGroupings.get(id) || [];
  }

  getAllScreenshotGroups(): ExcalidrawElement[][] {
    return Array.from(this.screenshotGroupings.values());
  }

  getWorkflowInState(selectedState: string): ExcalidrawElement[] {
    return this.workflow.map((e) => (e.id === selectedState ? { ...e, strokeColor: 'red' } : e));
  }
}

function App() {
  const [excalidrawDrawing, setExcalidrawDrawing] = useState<ExcalidrawData>();
  const [flowDiagram, setFlowDiagram] = useState<ExcalidrawFlowDiagram>();

  const handleFileUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setExcalidrawDrawing(data as ExcalidrawData);
        setFlowDiagram(new ExcalidrawFlowDiagram(data.elements as ExcalidrawElement[]));
      } catch (error) {
        console.error('Invalid file format', error);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    console.log({ flowDiagram });
  }, [flowDiagram]);

  useEffect(() => {
    console.log({ excalidrawDrawing });
  }, [excalidrawDrawing]);

  const linkOpen = (
    element: NonDeletedExcalidrawElement,
    event: CustomEvent<{
      nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
    }>
  ) => {
    const { link } = element;

    if (!link?.startsWith(ELEMENT_LINK_PREFIX)) return;

    const id = link.split('=')[1];
    const target = excalidrawDrawing?.elements.find((element) => element.id === id);

    console.log(target);
    event.preventDefault();
  };

  const diagrams: ExcalidrawElement[][] = [];

  if (flowDiagram) {
    diagrams.push(flowDiagram.getWorkflowInState(''), ...flowDiagram.getAllScreenshotGroups());
  }

  return (
    <>
      <input type="file" onChange={(e) => handleFileUpload(e.target.files?.[0])} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {diagrams.map((elements) => (
          <div key={elements[0].id} style={{ height: '33vh', width: '100vw' }}>
            <Excalidraw
              initialData={{
                ...excalidrawDrawing,
                elements
              }}
              onLinkOpen={linkOpen}
              viewModeEnabled={true} // Disables editing
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
