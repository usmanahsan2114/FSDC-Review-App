export interface Simulator {
  id: string;
  name: string;
  type: 'Aeromix' | 'AeroSim Pro';
  image?: any; // Using any for require() images, or string for URIs
}

export const FSDC_SIMULATORS: Simulator[] = [
  { 
    id: '1', 
    name: 'Super Mushshak', 
    type: 'Aeromix' 
  },
  { 
    id: '2', 
    name: 'Enstrom 280-FX', 
    type: 'Aeromix' 
  },
  { 
    id: '3', 
    name: 'Mushshak MFI-17', 
    type: 'AeroSim Pro' 
  },
  { 
    id: '4', 
    name: 'Mi-17', 
    type: 'AeroSim Pro' 
  },
  { 
    id: '5', 
    name: 'AS-350 / H125', 
    type: 'AeroSim Pro' 
  }
];
