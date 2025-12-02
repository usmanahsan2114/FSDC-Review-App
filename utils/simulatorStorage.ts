import { FSDC_SIMULATORS, SIMULATOR_TYPES, Simulator } from '@/constants/simulators';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SIMULATORS_KEY = 'fsdc_simulators_v1';
const SIMULATOR_TYPES_KEY = 'fsdc_simulator_types_v1';

export const getSimulators = async (): Promise<Simulator[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SIMULATORS_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    // Return defaults if not found, and save them for future consistency
    await saveSimulators(FSDC_SIMULATORS);
    return FSDC_SIMULATORS;
  } catch (e) {
    console.error('Error fetching simulators', e);
    return FSDC_SIMULATORS;
  }
};

export const saveSimulators = async (simulators: Simulator[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(simulators);
    await AsyncStorage.setItem(SIMULATORS_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving simulators', e);
  }
};

export const getSimulatorTypes = async (): Promise<string[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SIMULATOR_TYPES_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    // Return defaults
    const defaultTypes = [...SIMULATOR_TYPES];
    await saveSimulatorTypes(defaultTypes);
    return defaultTypes;
  } catch (e) {
    console.error('Error fetching simulator types', e);
    return [...SIMULATOR_TYPES];
  }
};

export const saveSimulatorTypes = async (types: string[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(types);
    await AsyncStorage.setItem(SIMULATOR_TYPES_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving simulator types', e);
  }
};
