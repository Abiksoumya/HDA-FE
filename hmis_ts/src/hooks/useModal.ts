import { useState, useCallback } from 'react';
import type { ModalConfig } from '@/types';

interface ModalState extends ModalConfig {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

export function useModal() {
  const [state, setState] = useState<ModalState>({ isOpen: false });

  const showModal = useCallback((config: ModalConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...config, isOpen: true, resolve });
    });
  }, []);

  const handleClose = useCallback(
    (result: boolean) => {
      setState((prev) => {
        prev.resolve?.(result);
        return { isOpen: false };
      });
    },
    [],
  );

  return { showModal, modalState: state, handleClose };
}
