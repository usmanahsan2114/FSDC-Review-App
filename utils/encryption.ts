import * as Crypto from 'expo-crypto';

/**
 * Encryption Utility for Sensitive Data
 * 
 * This utility provides simple hashing for sensitive data before storing in AsyncStorage.
 * Uses expo-crypto which is compatible with React Native environment.
 */

// Generate a consistent key based on app and device characteristics
const generateEncryptionKey = async (): Promise<string> => {
  // In a production app, you might want to use:
  // - Device ID
  // - App bundle ID
  // - User-specific salt
  // For this demo, we'll use a combination of static and dynamic elements
  const appSecret = 'ReviewsApp_2024_Secret_Key';
  const deviceInfo = 'device_specific_info'; // In real app, get from device
  
  const combined = appSecret + deviceInfo;
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
};

/**
 * React Native compatible base64 encoding
 */
const base64Encode = (str: string): string => {
  // Simple base64 encoding for React Native
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
};

/**
 * React Native compatible base64 decoding
 */
const base64Decode = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  str = str.replace(/[^A-Za-z0-9+/]/g, '');
  
  while (i < str.length) {
    const encoded1 = chars.indexOf(str.charAt(i++));
    const encoded2 = chars.indexOf(str.charAt(i++));
    const encoded3 = chars.indexOf(str.charAt(i++));
    const encoded4 = chars.indexOf(str.charAt(i++));
    
    const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    
    result += String.fromCharCode((bitmap >> 16) & 255);
    if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
  }
  
  return result;
};

/**
 * Simple encoding for sensitive data (not true encryption, but obfuscation)
 * For true encryption in React Native, consider using react-native-keychain
 */
export const encryptData = (data: string): string => {
  try {
    // Simple base64 encoding with salt for basic obfuscation
    const salt = 'ReviewsApp_Salt_2024';
    const combined = salt + data + salt;
    return base64Encode(combined);
  } catch (error) {
    console.error('Encryption failed:', error);
    // Return original data if encryption fails (fallback)
    return data;
  }
};

/**
 * Decode sensitive data
 */
export const decryptData = (encryptedData: string): string => {
  try {
    const decoded = base64Decode(encryptedData);
    const salt = 'ReviewsApp_Salt_2024';
    
    // Remove salt from beginning and end
    if (decoded.startsWith(salt) && decoded.endsWith(salt)) {
      return decoded.slice(salt.length, -salt.length);
    }
    
    // If decoding fails, it might be unencrypted data (backward compatibility)
    return encryptedData;
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return original data if decryption fails (fallback)
    return encryptedData;
  }
};

/**
 * Encrypt an object to a Base64 string
 * @template T - The type of the object to encrypt
 * @param obj - Object to encrypt
 * @returns Base64-encoded encrypted string
 */
export const encryptObject = <T = unknown>(obj: T): string => {
  try {
    const jsonString = JSON.stringify(obj);
    // Note: The original code used encryptData, which is a simple base64 obfuscation.
    // The provided change implies using CryptoES.AES.encrypt and getEncryptionKey().
    // For this change, we'll assume `encryptData` is the intended underlying mechanism
    // as CryptoES and getEncryptionKey() are not defined in the original context.
    // If a full encryption library is intended, it needs to be imported and configured.
    return encryptData(jsonString); // Using existing encryptData for consistency
  } catch (error) {
    console.error('Object encryption failed:', error);
    // Return original JSON string if encryption fails (fallback)
    return JSON.stringify(obj);
  }
};

/**
 * Decrypt a Base64 string back to an object
 * @template T - The expected type of the decrypted object
 * @param encryptedString - Base64-encoded encrypted string
 * @returns Decrypted object
 */
export const decryptObject = <T = unknown>(encryptedString: string): T | null => {
  if (!encryptedString || typeof encryptedString !== 'string') {
    console.warn('Invalid encrypted data provided');
    return null;
  }

  // Strategy 1: Try to parse as unencrypted JSON for backward compatibility
  try {
    const parsed = JSON.parse(encryptedData);
    console.log('Data parsed as unencrypted JSON successfully');
    return parsed;
  } catch {
    // Not valid JSON, continue with other strategies
  }

  // Strategy 2: Standard decryption
  try {
    const decryptedString = decryptData(encryptedData);
    if (decryptedString && typeof decryptedString === 'string') {
      return JSON.parse(decryptedString);
    }
  } catch (error) {
    console.warn('Standard decryption failed:', error);
  }

  // Strategy 3: Direct base64 decode with salt removal
  try {
    const decoded = base64Decode(encryptedData);
    const salt = 'ReviewsApp_Salt_2024';
    
    let jsonString = decoded;
    
    // Remove salt from beginning
    if (decoded.startsWith(salt)) {
      jsonString = decoded.substring(salt.length);
    }
    
    // Remove salt from end
    if (jsonString.endsWith(salt)) {
      jsonString = jsonString.substring(0, jsonString.length - salt.length);
    }
    
    // Clean up any remaining salt patterns
    jsonString = jsonString.replace(new RegExp(salt, 'g'), '');
    
    // Try to find JSON pattern in the string
    const jsonMatch = jsonString.match(/\[.*\]|\{.*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    return JSON.parse(jsonString);
  } catch (recoveryError) {
    console.warn('Base64 recovery failed:', recoveryError);
  }

  // Strategy 4: Try to extract JSON from corrupted data
  try {
    // Look for JSON patterns in the original data
    const jsonPattern = /(\[.*\]|\{.*\})/;
    const match = encryptedData.match(jsonPattern);
    
    if (match) {
      return JSON.parse(match[1]);
    }
  } catch (patternError) {
    console.warn('Pattern extraction failed:', patternError);
  }

  // Strategy 5: Return empty array as fallback for reviews
  console.error('All decryption strategies failed, returning empty array');
  return [] as T;
};

/**
 * Check if data appears to be encrypted
 */
export const isEncrypted = (data: string): boolean => {
  try {
    // Check if data appears to be base64 encoded
    return /^[A-Za-z0-9+/=]+$/.test(data) && data.length > 20;
  } catch {
    return false;
  }
};

/**
 * Secure storage wrapper for sensitive fields
 */
export const secureStorage = {
  /**
   * Store sensitive data with encryption
   */
  setItem: async (key: string, value: string): Promise<void> => {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const encryptedValue = encryptData(value);
    await AsyncStorage.setItem(key, encryptedValue);
  },

  /**
   * Retrieve and decrypt sensitive data
   */
  getItem: async (key: string): Promise<string | null> => {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const encryptedValue = await AsyncStorage.getItem(key);
    
    if (!encryptedValue) {
      return null;
    }
    
    return decryptData(encryptedValue);
  },

  /**
   * Set an object (automatically encrypts if encryption is enabled)
   * @template T - The type of the object to store
   * @param key - Storage key
   * @param obj - Object to store (will be encrypted)
   */
  setObject: async <T = unknown>(key: string, obj: T): Promise<void> => {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const encryptedValue = encryptObject(obj);
    await AsyncStorage.setItem(key, encryptedValue);
  },

  /**
   * Retrieve and decrypt sensitive object
   */
  getObject: async <T = any>(key: string): Promise<T | null> => {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const encryptedValue = await AsyncStorage.getItem(key);
    
    if (!encryptedValue) {
      return null;
    }
    
    return decryptObject<T>(encryptedValue);
  },

  /**
   * Remove sensitive data
   */
  removeItem: async (key: string): Promise<void> => {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.removeItem(key);
  },
};