import { FSDC_SIMULATORS, SIMULATOR_TYPES, Simulator } from '@/constants/simulators';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SIMULATORS_KEY = 'fsdc_simulators_v3';
const SIMULATOR_TYPES_KEY = 'fsdc_simulator_types_v2';

export const getSimulators = async (): Promise<Simulator[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SIMULATORS_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      // Merge with defaults to ensure new fields like imageUrl are present if missing
      // This is a simple migration strategy: if saved data lacks imageUrl, use default
      const merged = parsed.map((savedSim: Simulator) => {
        const defaultSim = FSDC_SIMULATORS.find(d => d.id === savedSim.id);
        return {
          ...defaultSim, // Use default as base (contains new fields like imageUrl)
          ...savedSim,   // Override with saved data (names, etc)
          imageUrl: savedSim.imageUrl || defaultSim?.imageUrl // Explicitly ensure imageUrl is populated
        };
      });
      
      // Also check if any new simulators were added to defaults that aren't in saved
      const savedIds = new Set(parsed.map((s: Simulator) => s.id));
      const newSims = FSDC_SIMULATORS.filter(d => !savedIds.has(d.id));
      
      return [...merged, ...newSims];
    } else {
      // First launch, save defaults
      await saveSimulators(FSDC_SIMULATORS);
      return FSDC_SIMULATORS;
    }
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
    } else {
      await saveSimulatorTypes(SIMULATOR_TYPES);
      return SIMULATOR_TYPES;
    }
  } catch (e) {
    console.error('Error fetching simulator types', e);
    return SIMULATOR_TYPES;
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
