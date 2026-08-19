'use client';

import { useState, useCallback } from 'react';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

/**
 * Programmatic confirmation dialog hook.
 * Pair with a <ConfirmDialog> component that reads this state.
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirm = useCallback(
    (title: string, message: string, onConfirm: () => void) => {
      setState({ open: true, title, message, onConfirm });
    },
    [],
  );

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm();
    close();
  }, [state, close]);

  return { ...state, confirm, close, handleConfirm };
}
