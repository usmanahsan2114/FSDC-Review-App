import { useSync } from '@/contexts/SyncProvider';
import { useThemeColor } from '@/hooks/use-theme-color';
import { rs } from '@/utils/responsive';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

export const ConnectivityStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const { isSyncing, syncError } = useSync();
  
  const successColor = useThemeColor({ light: '#4CAF50', dark: '#66BB6A' }, 'text');
  const errorColor = useThemeColor({ light: '#F44336', dark: '#EF5350' }, 'text');
  const warningColor = useThemeColor({ light: '#FF9800', dark: '#FFA726' }, 'text');
  const syncColor = useThemeColor({ light: '#2196F3', dark: '#42A5F5' }, 'text');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isSyncing) {
    return (
      <View style={styles.container}>
        <View style={[styles.dot, { backgroundColor: syncColor }]} />
        <ThemedText style={styles.text}>Syncing...</ThemedText>
      </View>
    );
  }

  if (syncError) {
    return (
      <View style={styles.container}>
        <View style={[styles.dot, { backgroundColor: errorColor }]} />
        <ThemedText style={styles.text}>Sync Error</ThemedText>
      </View>
    );
  }
  
  if (isConnected && isInternetReachable) {
    return (
      <View style={styles.container}>
        <View style={[styles.dot, { backgroundColor: successColor }]} />
        <ThemedText style={styles.text}>Online & Synced</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: isConnected ? warningColor : errorColor }]} />
      <ThemedText style={styles.text}>
        {!isConnected ? 'Offline' : 'No Internet'}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
  },
  dot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    marginRight: rs(6),
  },
  text: {
    fontSize: rs(12),
    opacity: 0.8,
  }
});
