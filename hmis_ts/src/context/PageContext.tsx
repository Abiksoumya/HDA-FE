import { createContext, useContext, useState, useEffect } from 'react';

const PageCardContext = createContext({ isFirst: true, register: () => {} });

let cardCount = 0;

export function PageCardProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function usePageCardFirst() {
  const [isFirst, setIsFirst] = useState(false);

  useEffect(() => {
    cardCount++;
    if (cardCount === 1) setIsFirst(true);
    return () => { cardCount--; };
  }, []);

  return isFirst;
}