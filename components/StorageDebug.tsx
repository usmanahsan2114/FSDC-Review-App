import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { clearCorruptedStorage, diagnoseStorageIssues } from '../utils/dataStorage';

/**
 * Temporary debug component to handle storage issues
 * This component should be removed after fixing the storage corruption
 */
export const StorageDebug: React.FC = () => {
  
  const handleClearStorage = async () => {
    Alert.alert(
      'Clear Storage',
      'This will clear all app data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await clearCorruptedStorage();
              if (success) {
                Alert.alert('Success', 'Storage cleared successfully. Please restart the app.');
              } else {
                Alert.alert('Error', 'Failed to clear storage');
              }
            } catch (error) {
              Alert.alert('Error', `Failed to clear storage: ${error}`);
            }
          }
        }
      ]
    );
  };

  const handleDiagnoseStorage = async () => {
    try {
      await diagnoseStorageIssues();
      Alert.alert('Diagnosis Complete', 'Check the console for storage diagnosis results');
    } catch (error) {
      Alert.alert('Error', `Failed to diagnose storage: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Storage Debug Tools</Text>
      <Text style={styles.subtitle}>Use these tools to fix storage corruption issues</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleDiagnoseStorage}>
        <Text style={styles.buttonText}>Diagnose Storage</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearStorage}>
        <Text style={[styles.buttonText, styles.dangerText]}>Clear All Storage</Text>
      </TouchableOpacity>
      
      <Text style={styles.warning}>
        ⚠️ Warning: Clearing storage will remove all reviews and data
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerText: {
    color: 'white',
  },
  warning: {
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});