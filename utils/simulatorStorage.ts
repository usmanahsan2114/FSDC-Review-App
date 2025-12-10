import { FSDC_SIMULATORS, SIMULATOR_TYPES, Simulator } from '@/constants/simulators';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SIMULATORS_KEY = 'fsdc_simulators_v3';
const SIMULATOR_TYPES_KEY = 'fsdc_simulator_types_v2';

export const getSimulators = async (): Promise<Simulator[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SIMULATORS_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      
      // 1. Merge with defaults to ensure new fields like imageUrl are present
      // Use a Map to ensure UNIQUENESS by ID.
      // If duplicates exist in storage, the LAST one processed wins (or we can stick to first).
      const uniqueSimulatorsMap = new Map<string, Simulator>();

      // First, populate with defaults to ensure we have base data
      FSDC_SIMULATORS.forEach(defaultSim => {
        uniqueSimulatorsMap.set(defaultSim.id, defaultSim);
      });

      // Then overwrite with saved data (merging properties)
      parsed.forEach((savedSim: Simulator) => {
        const existing = uniqueSimulatorsMap.get(savedSim.id);
        if (existing) {
          uniqueSimulatorsMap.set(savedSim.id, {
            ...existing,
            ...savedSim,
            imageUrl: savedSim.imageUrl || existing.imageUrl
          });
        } else {
          // If it's a saved simulator not in defaults (custom added), add it
          uniqueSimulatorsMap.set(savedSim.id, savedSim);
        }
      });
      
      const combinedSimulators = Array.from(uniqueSimulatorsMap.values());

      // 2. Extra Safety: Deduplicate by NAME to handle legacy issues where IDs might have changed
      // but names remained same (e.g. "Super Mushshak" with different IDs)
      const uniqueNames = new Set();
      const finalSimulators: Simulator[] = [];

      for (const sim of combinedSimulators) {
        if (!uniqueNames.has(sim.name)) {
          uniqueNames.add(sim.name);
          finalSimulators.push(sim);
        }
      }

      // 3. Save the cleaned list back to storage to fix the persistence issue permanently
      if (finalSimulators.length !== parsed.length) {
         console.log('Fixed duplicate simulators in storage');
         await saveSimulators(finalSimulators);
      }

      return finalSimulators;

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
