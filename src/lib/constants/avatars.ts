export interface PresetAvatar {
  id: string;
  name: string;
  category: 'Foto Nyata' | 'Ilustrasi / 3D';
  url: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'av_1',
    name: 'Budi (Default)',
    category: 'Foto Nyata',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_2',
    name: 'Alex Profesional',
    category: 'Foto Nyata',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_3',
    name: 'Sarah Minimalis',
    category: 'Foto Nyata',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_4',
    name: 'Dimas Kasual',
    category: 'Foto Nyata',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_5',
    name: 'Maya Kreatif',
    category: 'Foto Nyata',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_6',
    name: 'Rian Tech',
    category: 'Foto Nyata',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_7',
    name: 'Nadia Bisnis',
    category: 'Foto Nyata',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_8',
    name: 'Kevin Modern',
    category: 'Foto Nyata',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av_9',
    name: 'Ardana AI Bot',
    category: 'Ilustrasi / 3D',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ArdanaBot',
  },
  {
    id: 'av_10',
    name: 'Notionist Budi',
    category: 'Ilustrasi / 3D',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Budi',
  },
  {
    id: 'av_11',
    name: 'Notionist Sarah',
    category: 'Ilustrasi / 3D',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah',
  },
  {
    id: 'av_12',
    name: 'Fun Emoji Gold',
    category: 'Ilustrasi / 3D',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=FinancePro',
  },
];

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  country: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'IDR', name: 'Rupiah Indonesia', symbol: 'Rp', country: '🇮🇩' },
  { code: 'USD', name: 'US Dollar', symbol: '$', country: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: '🇪🇺' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: '🇸🇬' },
  { code: 'MYR', name: 'Ringgit Malaysia', symbol: 'RM', country: '🇲🇾' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: '🇯🇵' },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: '🇬🇧' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: '🇦🇺' },
];
