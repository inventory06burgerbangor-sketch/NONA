import { BookTheme, UserAccount } from '../types';

export const PRESET_COVERS: {
  id: string;
  name: string;
  theme: BookTheme;
  url: string;
  description: string;
}[] = [
  {
    id: 'botanical_sage',
    name: 'Botanical Herbarium',
    theme: 'botanical',
    url: '/src/assets/images/book_cover_botanical_1792397719135.jpg',
    description: 'Kertas daur ulang bertekstur dengan tanaman lavender & bunga kering estetis.',
  },
  {
    id: 'vintage_leather',
    name: 'Kulit Antik Filigree',
    theme: 'vintage',
    url: '/src/assets/images/book_cover_vintage_leather_1792397719039.jpg',
    description: 'Sampul kulit klasik dengan ornamen emas kuningan antik.',
  },
  {
    id: 'celestial_navy',
    name: 'Midnight Celestial',
    theme: 'celestial',
    url: '/src/assets/images/book_cover_celestial_1792397719610.jpg',
    description: 'Linen biru malam dengan rasi bintang dan fase bulan emas.',
  },
];

// No dummy users as explicitly requested: "Kosongkan semua usernya, jangan Ada Dummy User."
export const INITIAL_USERS: UserAccount[] = [];
