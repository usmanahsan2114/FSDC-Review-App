export interface Simulator {
  id: string;
  name: string;
  image?: any; // Using require() for local images
}

export const SIMULATOR_TYPES = ['AeroSim Pro', 'Aeromix'];

export const FSDC_SIMULATORS: Simulator[] = [
  { id: '1', name: 'Super Mushshak' },
  { id: '2', name: 'Enstrom 280-FX' },
  { id: '3', name: 'Mushshak MFI-17' },
  { id: '4', name: 'Mi-17' },
  { id: '5', name: 'AS-350/ H125' },
];
