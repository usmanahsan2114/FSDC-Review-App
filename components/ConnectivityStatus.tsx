import { useThemeColor } from '@/hooks/use-theme-color';
import { rs } from '@/utils/responsive';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

export const ConnectivityStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  
  
  const successColor = useThemeColor({ light: '#4CAF50', dark: '#66BB6A' }, 'text');
  const errorColor = useThemeColor({ light: '#F44336', dark: '#EF5350' }, 'text');
  const warningColor = useThemeColor({ light: '#FF9800', dark: '#FFA726' }, 'text');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // If fully connected, we might want to hide it or show a small green dot
  // For this "Offline Queue" recommendation, we want to show status clearly.
  
  if (isConnected && isInternetReachable) {
    return (
      <View style={styles.container}>
        <View style={[styles.dot, { backgroundColor: successColor }]} />
        <ThemedText style={styles.text}>Online & Saved</ThemedText>
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
