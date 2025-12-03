import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import React, { createContext, ReactNode, useContext } from 'react';

interface SyncContextType {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  syncReviews: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const syncState = useSupabaseSync();

  return (
    <SyncContext.Provider value={syncState}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
