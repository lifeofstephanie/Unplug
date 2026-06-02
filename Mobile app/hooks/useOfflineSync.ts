import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore } from '@/store';

export function useOfflineSync() {
  const { queue, clearQueue } = useOfflineStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && queue.length > 0) {
        // sync logic here (API calls etc.)
        clearQueue();
      }
    });

    return () => unsubscribe();
  }, [queue]);
}