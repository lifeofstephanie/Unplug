import { useEffect } from "react";
import * as Network from "expo-network";
import { useStore } from "../store";

export function useConnectivity() {
  const setOnline = useStore((s) => s.setOnline);
  const isOnline = useStore((s) => s.isOnline);

  useEffect(() => {
    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      setOnline(state.isInternetReachable ?? false);
    };

    check();
    const interval = setInterval(check, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  return { isOnline };
}
