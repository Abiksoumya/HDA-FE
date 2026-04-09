import { useCallback } from 'react';
import { useAppDispatch } from './redux';
import { addToast } from '@/store/slices/uiSlice';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export function useToast() {
  const dispatch = useAppDispatch();

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      dispatch(addToast({ message, type }));
    },
    [dispatch],
  );

  return { toast };
}
