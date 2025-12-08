export interface Simulator {
  id: string;
  name: string;
  type?: string;
  image?: any; // Using require() for local images
  imageUrl?: string; // URL for remote images
}

export const SIMULATOR_TYPES = ['AeroSim Pro', 'Aeromix'];

export const FSDC_SIMULATORS: Simulator[] = [
  { 
    id: '1', 
    name: 'Super Mushshak',
    imageUrl: 'https://fsdcpak.com/assets/img/home/super-mushak.webp'
  },
  { 
    id: '2', 
    name: 'Enstrom 280-FX',
    imageUrl: 'https://fsdcpak.com/assets/img/home/about2.webp'
  },
  { 
    id: '3', 
    name: 'Mushshak MFI-17',
    imageUrl: 'https://fsdcpak.com/assets/img/home/hero-01.webp'
  },
  { 
    id: '4', 
    name: 'Mi-17',
    imageUrl: 'https://fsdcpak.com/assets/img/home/hero-01.webp'
  },
  { 
    id: '5', 
    name: 'AS-350/ H125',
    imageUrl: 'https://fsdcpak.com/assets/img/home/hero-01.webp'
  },
];
