import { useCallback, useEffect } from 'react';
import { ExcalidrawProps } from '@excalidraw/excalidraw/types/types';

/** calls the supplied callback when Alt-R is hit or optionally when the callback is invoked */
export function useRevertToEditMode(revertToEditMode: () => void) {
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

  const onChange: ExcalidrawProps['onChange'] = (_, appState) => {
    if (!appState.viewModeEnabled) {
      revertToEditMode();
    }
  };

  return {
    revertToEditModeOnLeavingViewMode: useCallback(onChange, [revertToEditMode])
  };
}
