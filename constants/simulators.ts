export interface Simulator {
  id: string;
  name: string;
  type: string;
  image?: any; // Using require() for local images
}

export const SIMULATOR_TYPES = ['AeroSim Pro', 'AeroMix', 'AeroFision', 'AeroFlex'];

export const FSDC_SIMULATORS: Simulator[] = [
  { id: '1', name: 'Super Mushshak (Fixed Wing)', type: 'AeroSim Pro' },
  { id: '2', name: 'Mi-17 (Rotary Wing)', type: 'AeroSim Pro' },
  { id: '3', name: 'Bell 412 (Rotary Wing)', type: 'AeroMix' },
  { id: '4', name: 'Cessna 172 (Fixed Wing)', type: 'AeroMix' },
  { id: '5', name: 'Generic VR Trainer', type: 'AeroFlex' },
  { id: '6', name: 'Hybrid Infinity System', type: 'AeroFision' },
];
