import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, ChevronLeft, BookOpen, RefreshCw } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useQuran } from '../../../hooks/useQuran';
import { generateTafseer } from '../../../lib/glm';

export default function TafseerScreen() {
  const { surah, ayah } = useLocalSearchParams();
  const router = useRouter();

  const surahId = parseInt(surah as string, 10);
  const ayahNum = parseInt(ayah as string, 10);

  const { surah: surahData, isLoading: surahLoading } = useQuran(surahId);

  const [tafseerText, setTafseerText] = useState<string | null>(null);
  const [isLoadingTafseer, setIsLoadingTafseer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAyah, setCurrentAyah] = useState(ayahNum);

  const ayahData = surahData?.ayahs.find((a) => a.number === currentAyah);
  const totalAyahs = surahData?.verses ?? 0;

  // Load tafseer whenever ayah changes and surah text is available
  useEffect(() => {
    // 1. Wait until the Surah has actually finished loading from the API
    if (surahLoading || !surahData) return;

    // 2. Ensure we actually have text before asking the AI to explain it
    if (!ayahData?.text) {
      setError('لم يتم العثور على نص الآية.');
      return;
    }

    let cancelled = false;
    setTafseerText(null);
    setError(null);
    setIsLoadingTafseer(true);

    generateTafseer({
      surahNumber: surahId,
      ayahNumber: currentAyah,
      ayahText: ayahData.text, // Pass the clean text string
      language: 'ar',
    })
      .then((text) => { if (!cancelled) setTafseerText(text); })
      .catch((err) => {
        console.error("Tafseer Fetch Error:", err); // Helpful for debugging!
        if (!cancelled) setError('تعذّر تحميل التفسير. تحقق من اتصالك بالإنترنت.');
      })
      .finally(() => { if (!cancelled) setIsLoadingTafseer(false); });

    return () => { cancelled = true; };

  }, [surahId, currentAyah, surahLoading, ayahData?.text]);

  const goPrev = () => { if (currentAyah > 1) setCurrentAyah((n) => n - 1); };
  const goNext = () => { if (currentAyah < totalAyahs) setCurrentAyah((n) => n + 1); };

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>

      {/* Header */}
      <BlurView intensity={20} tint="dark" className="pt-16 pb-4 px-4 flex-row justify-between items-center border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()} className="p-2 border border-white/10 rounded-full">
          <ChevronRight color="white" size={24} />
        </TouchableOpacity>
        <View className="items-center flex-1">
          <Text className="text-white font-amiri text-xl">
            {surahData?.name ?? `سورة ${surahId}`}
          </Text>
          <Text className="text-emerald-400 font-tajawal text-xs mt-0.5">
            الآية {currentAyah} من {totalAyahs}
          </Text>
        </View>
        <View className="w-10 h-10 bg-emerald-500/20 rounded-full items-center justify-center border border-emerald-500/30">
          <BookOpen color="#34D399" size={18} />
        </View>
      </BlurView>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 24, paddingBottom: 120 }}>

        {/* Ayah text card */}
        {surahLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#10B981" />
          </View>
        ) : ayahData ? (
          <View className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 mb-6">
            <Text className="text-white/50 font-tajawal text-xs mb-4 text-left">
              ﴿ {currentAyah} ﴾
            </Text>
            <Text
              className="text-white font-amiri text-2xl leading-[3rem] text-right"
              style={{ writingDirection: 'rtl' }}
            >
              {ayahData.text}
            </Text>
          </View>
        ) : null}

        {/* Tafseer section */}
        <View className="mb-6">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-1 h-6 bg-emerald-500 rounded-full" />
            <Text className="text-white font-tajawal font-bold text-lg">التفسير</Text>
            <View className="flex-1 h-px bg-white/10" />
          </View>

          {isLoadingTafseer && (
            <View className="bg-[#1E293B] border border-white/10 rounded-3xl p-8 items-center gap-4">
              <ActivityIndicator color="#10B981" size="large" />
              <Text className="text-slate-400 font-tajawal text-sm">
                يُحضّر نور التفسير...
              </Text>
            </View>
          )}

          {error && !isLoadingTafseer && (
            <View className="bg-[#1E293B] border border-red-500/20 rounded-3xl p-6 items-center gap-4">
              <Text className="text-slate-400 font-tajawal text-center">{error}</Text>
              <TouchableOpacity
                onPress={() => setCurrentAyah((n) => n)} // re-trigger effect
                className="flex-row items-center gap-2 bg-emerald-500/20 px-5 py-2.5 rounded-2xl border border-emerald-500/30"
              >
                <RefreshCw color="#34D399" size={16} />
                <Text className="text-emerald-400 font-tajawal font-bold">إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          )}

          {tafseerText && !isLoadingTafseer && (
            <View className="bg-[#1E293B] border border-white/10 rounded-3xl p-6">
              <Text
                className="text-slate-200 font-tajawal text-base leading-8 text-right"
                style={{ writingDirection: 'rtl' }}
              >
                {tafseerText}
              </Text>
              <View className="mt-4 pt-4 border-t border-white/10">
                <Text className="text-slate-500 font-tajawal text-xs text-center">
                  التفسير مُولَّد بالذكاء الاصطناعي • يُنصح بمراجعة كتب التفسير المعتمدة
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ayah navigation bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#0F172A] border-t border-white/10 px-6 pb-8 pt-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={goNext}
            disabled={currentAyah >= totalAyahs}
            className={`flex-row items-center gap-2 px-5 py-3 rounded-2xl border ${currentAyah < totalAyahs
              ? 'bg-white/5 border-white/10'
              : 'bg-white/5 border-white/5 opacity-30'
              }`}
          >
            <ChevronLeft color="white" size={18} />
            <Text className="text-white font-tajawal text-sm">التالية</Text>
          </TouchableOpacity>

          <Text className="text-slate-400 font-tajawal text-sm">
            {currentAyah} / {totalAyahs}
          </Text>

          <TouchableOpacity
            onPress={goPrev}
            disabled={currentAyah <= 1}
            className={`flex-row items-center gap-2 px-5 py-3 rounded-2xl border ${currentAyah > 1
              ? 'bg-white/5 border-white/10'
              : 'bg-white/5 border-white/5 opacity-30'
              }`}
          >
            <Text className="text-white font-tajawal text-sm">السابقة</Text>
            <ChevronRight color="white" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
