import React from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

export function useConfirmDialog() {
  const [state, setState] = React.useState<(ConfirmDialogProps & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = React.useCallback((opts: Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
    return new Promise(resolve => {
      setState({
        ...opts,
        resolve,
        onConfirm: () => { setState(null); resolve(true); },
        onCancel:  () => { setState(null); resolve(false); },
      });
    });
  }, []);

  const dialog = state ? <ConfirmDialog {...state} /> : null;

  return { confirm, dialog };
}
