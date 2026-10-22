// The chosen time frame (Day, Week, Month, Quarter, Year) and how far back, shared by every tab (founder, 22 Oct 2026).
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Range } from './trends';

const Ctx = createContext<{ range: Range; setRange: (r: Range) => void; back: number; setBack: (n: number) => void }>({
  range: 'D', setRange: () => {}, back: 0, setBack: () => {},
});

export function RangeProvider({ children }: { children: ReactNode }) {
  const [range, set] = useState<Range>('D');
  const [back, setBack] = useState(0);
  const value = useMemo(() => ({ range, back, setBack, setRange: (r: Range) => { set(r); setBack(0); } }), [range, back]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useRange = () => useContext(Ctx);
