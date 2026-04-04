import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Reciter {
  id: string;
  nameAr: string;
  nameEn: string;
  folder: string; // everyayah.com folder name
  bitrate: string;
}

export const RECITERS: Reciter[] = [
  { id: 'alafasy',      nameAr: 'مشاري العفاسي',         nameEn: 'Mishary Alafasy',       folder: 'Alafasy_128kbps',                    bitrate: '128' },
  { id: 'sudais',       nameAr: 'عبدالرحمن السديس',       nameEn: 'Abdul Rahman Al-Sudais', folder: 'Sudais_192kbps',                     bitrate: '192' },
  { id: 'husary',       nameAr: 'محمود خليل الحصري',     nameEn: 'Mahmoud Al-Husary',      folder: 'Husary_128kbps',                     bitrate: '128' },
  { id: 'minshawi',     nameAr: 'محمد صديق المنشاوي',    nameEn: 'Mohamed Al-Minshawi',    folder: 'Minshawi_Murattal_128kbps',          bitrate: '128' },
  { id: 'maher',        nameAr: 'ماهر المعيقلي',          nameEn: 'Maher Al-Muaiqly',      folder: 'Maher_AlMuaiqly_128kbps',           bitrate: '128' },
  { id: 'abdulbasit',   nameAr: 'عبدالباسط عبدالصمد',    nameEn: 'Abdul Basit',            folder: 'Abdul_Basit_Murattal_192kbps',      bitrate: '192' },
  { id: 'ajamy',        nameAr: 'أحمد العجمي',            nameEn: 'Ahmed Al-Ajamy',         folder: 'ahmed_ibn_ali_al-ajamy128kbps',     bitrate: '128' },
  { id: 'hanirifai',    nameAr: 'هاني الرفاعي',           nameEn: 'Hani Ar-Rifai',          folder: 'Hani_Rifai_192kbps',                bitrate: '192' },
];

export const DEFAULT_RECITER_ID = 'alafasy';

const STORAGE_KEY = 'noor_selected_reciter';

export function buildAudioUrl(reciterFolder: string, surah: number, ayah: number): string {
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/${reciterFolder}/${s}${a}.mp3`;
}

export async function getSelectedReciter(): Promise<Reciter> {
  try {
    const id = await AsyncStorage.getItem(STORAGE_KEY);
    return RECITERS.find((r) => r.id === id) ?? RECITERS[0];
  } catch {
    return RECITERS[0];
  }
}

export async function saveSelectedReciter(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, id);
}
