import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface PositionsReloadContextType {
  reloadPositions: () => void;
  reloadSignal: number;
}

const PositionsReloadContext = createContext<PositionsReloadContextType | undefined>(undefined);

export const usePositionsReload = () => {
  const context = useContext(PositionsReloadContext);
  if (!context) {
    throw new Error('usePositionsReload must be used within a PositionsReloadProvider');
  }
  return context;
};

export const PositionsReloadProvider = ({ children }: { children: ReactNode }) => {
  const [reloadSignal, setReloadSignal] = useState(0);
  const reloadPositions = useCallback(() => {
    setReloadSignal((prev) => prev + 1);
  }, []);

  return (
    <PositionsReloadContext.Provider value={{ reloadPositions, reloadSignal }}>
      {children}
    </PositionsReloadContext.Provider>
  );
}; 