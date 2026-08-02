import { useLocation } from 'react-router-dom';
import { useAppSelector } from './redux';

// Returns the list of button names configured for the current page via the menu API.
// Falls back to ['Close', 'Submit'] if the menu hasn't loaded yet or the page isn't in the map.
export function usePageButtons(): string[] {
  const { pathname } = useLocation();
  const pageButtons = useAppSelector((s) => s.ui.pageButtons);
  const hasLoaded = Object.keys(pageButtons).length > 0;

  if (!hasLoaded) return ['Close', 'Submit'];

  return pageButtons[pathname] ?? ['Close', 'Submit'];
}
