export interface Simulator {
  id: string;
  name: string;
  type: string;
  image?: any; // Using require() for local images
}

export const SIMULATOR_TYPES = ['Fixed Wing', 'Rotary Wing'];

export const FSDC_SIMULATORS: Simulator[] = [
  { id: '1', name: 'Super Mushshak', type: 'Fixed Wing' },
  { id: '2', name: 'Mi-17', type: 'Rotary Wing' },
  { id: '3', name: 'Bell 412', type: 'Rotary Wing' },
  { id: '4', name: 'Cessna 172', type: 'Fixed Wing' },
  { id: '5', name: 'Hybrid Infinity System', type: 'Fixed Wing' },
];
