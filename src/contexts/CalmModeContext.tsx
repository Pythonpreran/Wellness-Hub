import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CalmModeContextType {
  isCalm: boolean;
  setIsCalm: (calm: boolean) => void;
}

const CalmModeContext = createContext<CalmModeContextType | undefined>(undefined);

export const CalmModeProvider = ({ children }: { children: ReactNode }) => {
  const [isCalm, setIsCalm] = useState(() => {
    const stored = sessionStorage.getItem('calm_mode');
    return stored === 'true';
  });

  useEffect(() => {
    sessionStorage.setItem('calm_mode', isCalm.toString());
  }, [isCalm]);

  return (
    <CalmModeContext.Provider value={{ isCalm, setIsCalm }}>
      {children}
    </CalmModeContext.Provider>
  );
};

export const useCalmMode = () => {
  const context = useContext(CalmModeContext);
  if (!context) {
    throw new Error('useCalmMode must be used within CalmModeProvider');
  }
  return context;
};
