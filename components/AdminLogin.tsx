import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, HelperText, IconButton, TextInput } from 'react-native-paper';
import { hp, wp } from '../utils/responsive';

interface AdminLoginProps {
  onLogin: () => void;
}

const ADMIN_PIN = '2114'; // Simple PIN for now

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { colors } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  
  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      onLogin();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <IconButton
        icon="arrow-left"
        size={24}
        onPress={() => router.back()}
        style={styles.topLeftBackButton}
        iconColor={colors.primary}
      />
      <Card style={styles.card}>
        <Card.Content>
          <ThemedText type="title" style={styles.title}>Admin Access</ThemedText>
          <ThemedText style={styles.subtitle}>Please enter the PIN to continue.</ThemedText>
          
          <TextInput
            label="Enter PIN"
            value={pin}
            onChangeText={(text) => {
              setPin(text);
              setError('');
            }}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            style={styles.input}
            mode="outlined"
            error={!!error}
            right={<TextInput.Icon icon="lock" />}
          />
          {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}
          
          <Button 
            mode="contained" 
            onPress={handleLogin} 
            style={styles.button}
            contentStyle={{ height: 50 }}
          >
            Login
          </Button>
        </Card.Content>
      </Card>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
    position: 'relative', // Ensure relative positioning for absolute children
  },
  topLeftBackButton: {
    position: 'absolute',
    top: hp('5%'), // Adjust for safe area approx
    left: wp('5%'),
    zIndex: 10,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: hp('1%'),
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: hp('3%'),
    opacity: 0.7,
  },
  input: {
    marginBottom: hp('1%'),
  },
  button: {
    marginTop: hp('2%'),
  },
  backButton: {
    marginTop: hp('1%'),
    borderColor: 'transparent',
  },
});
