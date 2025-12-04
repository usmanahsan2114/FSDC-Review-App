import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Storage keys
const DEVICE_ID_KEY = 'device_id';
const DEVICE_NAME_KEY = 'device_name';
const ADMIN_PIN_KEY = 'admin_pin';

// Default values
const DEFAULT_DEVICE_NAME = 'FSDC Device';
const DEFAULT_ADMIN_PIN = '2114';

/**
 * Generate a UUID v4 using expo-crypto
 */
const generateUUID = (): string => {
  const randomBytes = Crypto.getRandomBytes(16);
  // Set version (4) and variant (8, 9, A, or B)
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // variant
  
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

/**
 * Device Configuration Utility
 * Manages device ID, device name, and admin PIN stored locally.
 * Each device has a unique ID and configurable name/PIN.
 */

/**
 * Get the unique device ID. Auto-generates one on first call.
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('Generated new device ID:', deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a timestamp-based ID if UUID fails
    const fallbackId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, fallbackId);
    return fallbackId;
  }
};

/**
 * Set a new device ID (user-editable).
 */
export const setDeviceId = async (id: string): Promise<void> => {
  try {
    const trimmedId = id.trim();
    if (!trimmedId) {
      throw new Error('Device ID cannot be empty');
    }
    await AsyncStorage.setItem(DEVICE_ID_KEY, trimmedId);
    console.log('Device ID updated to:', trimmedId);
  } catch (error) {
    console.error('Error setting device ID:', error);
    throw new Error('Failed to save device ID');
  }
};

/**
 * Generate a new random device ID.
 */
export const regenerateDeviceId = async (): Promise<string> => {
  const newId = generateUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  console.log('Regenerated device ID:', newId);
  return newId;
};

/**
 * Get the device name. Returns default if not set.
 */
export const getDeviceName = async (): Promise<string> => {
  try {
    const name = await AsyncStorage.getItem(DEVICE_NAME_KEY);
    return name || DEFAULT_DEVICE_NAME;
  } catch (error) {
    console.error('Error getting device name:', error);
    return DEFAULT_DEVICE_NAME;
  }
};

/**
 * Set a new device name.
 */
export const setDeviceName = async (name: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(DEVICE_NAME_KEY, name.trim() || DEFAULT_DEVICE_NAME);
    console.log('Device name updated to:', name);
  } catch (error) {
    console.error('Error setting device name:', error);
    throw new Error('Failed to save device name');
  }
};

/**
 * Get the admin PIN. Returns default if not set.
 */
export const getAdminPin = async (): Promise<string> => {
  try {
    const pin = await AsyncStorage.getItem(ADMIN_PIN_KEY);
    return pin || DEFAULT_ADMIN_PIN;
  } catch (error) {
    console.error('Error getting admin PIN:', error);
    return DEFAULT_ADMIN_PIN;
  }
};

/**
 * Set a new admin PIN.
 */
export const setAdminPin = async (pin: string): Promise<void> => {
  try {
    if (pin.length < 4) {
      throw new Error('PIN must be at least 4 characters');
    }
    await AsyncStorage.setItem(ADMIN_PIN_KEY, pin);
    console.log('Admin PIN updated');
  } catch (error) {
    console.error('Error setting admin PIN:', error);
    throw error;
  }
};

/**
 * Validate a PIN against the stored admin PIN.
 */
export const validateAdminPin = async (inputPin: string): Promise<boolean> => {
  const storedPin = await getAdminPin();
  return inputPin === storedPin;
};

/**
 * Get all device config as an object.
 */
export const getDeviceConfig = async (): Promise<{
  deviceId: string;
  deviceName: string;
  adminPin: string;
}> => {
  const [deviceId, deviceName, adminPin] = await Promise.all([
    getDeviceId(),
    getDeviceName(),
    getAdminPin(),
  ]);
  return { deviceId, deviceName, adminPin };
};

/**
 * Reset device config to defaults (except device ID which is permanent).
 */
export const resetDeviceConfig = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(DEVICE_NAME_KEY, DEFAULT_DEVICE_NAME);
    await AsyncStorage.setItem(ADMIN_PIN_KEY, DEFAULT_ADMIN_PIN);
    console.log('Device config reset to defaults');
  } catch (error) {
    console.error('Error resetting device config:', error);
    throw new Error('Failed to reset device config');
  }
};
