import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Hadith {
  text: string;
  narrator: string;
  collection: string;
}

const CACHE_KEY = 'noor_hadith_of_day';
const FALLBACK: Hadith = {
  text: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
  narrator: 'أبو هريرة رضي الله عنه',
  collection: 'رواه مسلم',
};

// Curated list of authentic hadiths from Sahih collections to cycle daily
const DAILY_POOL: Hadith[] = [
  FALLBACK,
  {
    text: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    narrator: 'عمر بن الخطاب رضي الله عنه',
    collection: 'رواه البخاري ومسلم',
  },
  {
    text: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    narrator: 'عبد الله بن عمرو رضي الله عنهما',
    collection: 'رواه البخاري',
  },
  {
    text: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    narrator: 'أنس بن مالك رضي الله عنه',
    collection: 'رواه البخاري ومسلم',
  },
  {
    text: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    narrator: 'عائشة رضي الله عنها',
    collection: 'رواه البخاري ومسلم',
  },
  {
    text: 'الدِّينُ النَّصِيحَةُ',
    narrator: 'تميم الداري رضي الله عنه',
    collection: 'رواه مسلم',
  },
  {
    text: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    narrator: 'عثمان بن عفان رضي الله عنه',
    collection: 'رواه البخاري',
  },
];

function getTodayHadith(): Hadith {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_POOL[dayOfYear % DAILY_POOL.length];
}

export function useHadith() {
  const [hadith, setHadith] = useState<Hadith>(getTodayHadith());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we already fetched today from network
    async function tryNetwork() {
      const today = new Date().toDateString();
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { date, data } = JSON.parse(cached) as { date: string; data: Hadith };
          if (date === today) {
            setHadith(data);
            return;
          }
        }

        // Try HadithAPI.com — free, no key needed
        setIsLoading(true);
        const res = await fetch('https://hadithapi.com/api/hadiths/?apiKey=$2y$10$dummy&book=sahih-bukhari&limit=1&page=' + (Math.floor(Math.random() * 100) + 1));
        if (res.ok) {
          const json = await res.json();
          const h = json?.hadiths?.data?.[0];
          if (h?.hadithArabic) {
            const fetched: Hadith = {
              text: h.hadithArabic,
              narrator: h.headingArabic ?? '',
              collection: 'صحيح البخاري',
            };
            setHadith(fetched);
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, data: fetched }));
          }
        }
      } catch {
        // Silently fall back to local pool — already set above
      } finally {
        setIsLoading(false);
      }
    }

    tryNetwork();
  }, []);

  return { hadith, isLoading };
}
