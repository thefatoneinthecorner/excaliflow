### Excaliflow Workflow and Mockup Viewer

Excaliflow is an Excalidraw extension which enhances Excalidraw’s View Mode to display workflow and mockup diagrams side by side. Clicking a navigation element in the mockup switches to a new highlighted state in the workflow and changes the mockup.

### Overview

An Excaliflow diagram consists of:

- **Mockups**: Grouped elements representing states or screens in a workflow.
- **Workflow**: A separate set of elements representing states and transitions between states.

**Links**:

- Workflow states can link to mockups (using Excalidraw links).
- Mockup elements can link to other mockups (to emulate buttons or navigation).

The viewer displays the workflow in one panel and a selected mockup in another. Clicking through linked states or mockups highlights the corresponding state in the workflow.

---

### Edit Mode

In Excalidraw's Edit Mode, the following options are available in the main menu:

- **Export to Slide Deck**: Converts the drawing into a sequence of slides, one per mockup. Workflow states and links navigate between slides.
- **Swap Sides**: Switches the positions of the workflow and mockup panels in View Mode and exported slides.

**Shortcut:**

- Hold **Alt** while drawing an arrow to automatically convert it into an Excalidraw link (and delete the arrow).

---

### View Mode

View Mode splits the diagram into two panels:

- **Workflow Panel**: Displays the workflow.
- **Mockup Panel**: Displays a selected mockup.

Clicking on a workflow state or a mockup link updates the viewer to show the corresponding mockup or highlights the related workflow state.

---

### Creating Mockups

- **Definition**: A mockup is a group of Excalidraw elements (created with Cmd/Ctrl+G) linked to or containing linked elements.
- **Links**: Mockups typically include links to other mockups.
- **Titles**:
    - The mockup’s title is the top-left text element within the group.
    - If no top-left text is present, the mockup remains untitled.

---

### Creating Workflows

- **Definition**: The workflow includes all elements not part of a mockup.
- **Links**: Workflow elements should only link to mockups.