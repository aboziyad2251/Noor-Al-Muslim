import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, ChevronLeft, BookOpen, RefreshCw, X, ChevronDown } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useQuran } from '../../../hooks/useQuran';
import { generateTafseer } from '../../../lib/glm';

// Static surah list — name + verse count (no network needed)
const SURAHS = [
  { id: 1,  name: 'الفاتحة',    verses: 7 },
  { id: 2,  name: 'البقرة',     verses: 286 },
  { id: 3,  name: 'آل عمران',   verses: 200 },
  { id: 4,  name: 'النساء',     verses: 176 },
  { id: 5,  name: 'المائدة',    verses: 120 },
  { id: 6,  name: 'الأنعام',    verses: 165 },
  { id: 7,  name: 'الأعراف',    verses: 206 },
  { id: 8,  name: 'الأنفال',    verses: 75 },
  { id: 9,  name: 'التوبة',     verses: 129 },
  { id: 10, name: 'يونس',       verses: 109 },
  { id: 11, name: 'هود',        verses: 123 },
  { id: 12, name: 'يوسف',       verses: 111 },
  { id: 13, name: 'الرعد',      verses: 43 },
  { id: 14, name: 'إبراهيم',    verses: 52 },
  { id: 15, name: 'الحجر',      verses: 99 },
  { id: 16, name: 'النحل',      verses: 128 },
  { id: 17, name: 'الإسراء',    verses: 111 },
  { id: 18, name: 'الكهف',      verses: 110 },
  { id: 19, name: 'مريم',       verses: 98 },
  { id: 20, name: 'طه',         verses: 135 },
  { id: 21, name: 'الأنبياء',   verses: 112 },
  { id: 22, name: 'الحج',       verses: 78 },
  { id: 23, name: 'المؤمنون',   verses: 118 },
  { id: 24, name: 'النور',      verses: 64 },
  { id: 25, name: 'الفرقان',    verses: 77 },
  { id: 26, name: 'الشعراء',    verses: 227 },
  { id: 27, name: 'النمل',      verses: 93 },
  { id: 28, name: 'القصص',      verses: 88 },
  { id: 29, name: 'العنكبوت',   verses: 69 },
  { id: 30, name: 'الروم',      verses: 60 },
  { id: 31, name: 'لقمان',      verses: 34 },
  { id: 32, name: 'السجدة',     verses: 30 },
  { id: 33, name: 'الأحزاب',    verses: 73 },
  { id: 34, name: 'سبأ',        verses: 54 },
  { id: 35, name: 'فاطر',       verses: 45 },
  { id: 36, name: 'يس',         verses: 83 },
  { id: 37, name: 'الصافات',    verses: 182 },
  { id: 38, name: 'ص',          verses: 88 },
  { id: 39, name: 'الزمر',      verses: 75 },
  { id: 40, name: 'غافر',       verses: 85 },
  { id: 41, name: 'فصلت',       verses: 54 },
  { id: 42, name: 'الشورى',     verses: 53 },
  { id: 43, name: 'الزخرف',     verses: 89 },
  { id: 44, name: 'الدخان',     verses: 59 },
  { id: 45, name: 'الجاثية',    verses: 37 },
  { id: 46, name: 'الأحقاف',    verses: 35 },
  { id: 47, name: 'محمد',       verses: 38 },
  { id: 48, name: 'الفتح',      verses: 29 },
  { id: 49, name: 'الحجرات',    verses: 18 },
  { id: 50, name: 'ق',          verses: 45 },
  { id: 51, name: 'الذاريات',   verses: 60 },
  { id: 52, name: 'الطور',      verses: 49 },
  { id: 53, name: 'النجم',      verses: 62 },
  { id: 54, name: 'القمر',      verses: 55 },
  { id: 55, name: 'الرحمن',     verses: 78 },
  { id: 56, name: 'الواقعة',    verses: 96 },
  { id: 57, name: 'الحديد',     verses: 29 },
  { id: 58, name: 'المجادلة',   verses: 22 },
  { id: 59, name: 'الحشر',      verses: 24 },
  { id: 60, name: 'الممتحنة',   verses: 13 },
  { id: 61, name: 'الصف',       verses: 14 },
  { id: 62, name: 'الجمعة',     verses: 11 },
  { id: 63, name: 'المنافقون',  verses: 11 },
  { id: 64, name: 'التغابن',    verses: 18 },
  { id: 65, name: 'الطلاق',     verses: 12 },
  { id: 66, name: 'التحريم',    verses: 12 },
  { id: 67, name: 'الملك',      verses: 30 },
  { id: 68, name: 'القلم',      verses: 52 },
  { id: 69, name: 'الحاقة',     verses: 52 },
  { id: 70, name: 'المعارج',    verses: 44 },
  { id: 71, name: 'نوح',        verses: 28 },
  { id: 72, name: 'الجن',       verses: 28 },
  { id: 73, name: 'المزمل',     verses: 20 },
  { id: 74, name: 'المدثر',     verses: 56 },
  { id: 75, name: 'القيامة',    verses: 40 },
  { id: 76, name: 'الإنسان',    verses: 31 },
  { id: 77, name: 'المرسلات',   verses: 50 },
  { id: 78, name: 'النبأ',      verses: 40 },
  { id: 79, name: 'النازعات',   verses: 46 },
  { id: 80, name: 'عبس',        verses: 42 },
  { id: 81, name: 'التكوير',    verses: 29 },
  { id: 82, name: 'الانفطار',   verses: 19 },
  { id: 83, name: 'المطففين',   verses: 36 },
  { id: 84, name: 'الانشقاق',   verses: 25 },
  { id: 85, name: 'البروج',     verses: 22 },
  { id: 86, name: 'الطارق',     verses: 17 },
  { id: 87, name: 'الأعلى',     verses: 19 },
  { id: 88, name: 'الغاشية',    verses: 26 },
  { id: 89, name: 'الفجر',      verses: 30 },
  { id: 90, name: 'البلد',      verses: 20 },
  { id: 91, name: 'الشمس',      verses: 15 },
  { id: 92, name: 'الليل',      verses: 21 },
  { id: 93, name: 'الضحى',      verses: 11 },
  { id: 94, name: 'الشرح',      verses: 8 },
  { id: 95, name: 'التين',      verses: 8 },
  { id: 96, name: 'العلق',      verses: 19 },
  { id: 97, name: 'القدر',      verses: 5 },
  { id: 98, name: 'البينة',     verses: 8 },
  { id: 99, name: 'الزلزلة',    verses: 8 },
  { id: 100, name: 'العاديات',  verses: 11 },
  { id: 101, name: 'القارعة',   verses: 11 },
  { id: 102, name: 'التكاثر',   verses: 8 },
  { id: 103, name: 'العصر',     verses: 3 },
  { id: 104, name: 'الهمزة',    verses: 9 },
  { id: 105, name: 'الفيل',     verses: 5 },
  { id: 106, name: 'قريش',      verses: 4 },
  { id: 107, name: 'الماعون',   verses: 7 },
  { id: 108, name: 'الكوثر',    verses: 3 },
  { id: 109, name: 'الكافرون',  verses: 6 },
  { id: 110, name: 'النصر',     verses: 3 },
  { id: 111, name: 'المسد',     verses: 5 },
  { id: 112, name: 'الإخلاص',   verses: 4 },
  { id: 113, name: 'الفلق',     verses: 5 },
  { id: 114, name: 'الناس',     verses: 6 },
];

function SurahNavigatorModal({
  visible,
  currentSurah,
  currentAyah,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentSurah: number;
  currentAyah: number;
  onSelect: (surah: number, ayah: number) => void;
  onClose: () => void;
}) {
  const [expandedSurah, setExpandedSurah] = useState<number | null>(currentSurah);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View style={{ flex: 1, marginTop: 60, backgroundColor: '#0F172A', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>

          {/* Modal header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 }}>
              <X color="white" size={20} />
            </TouchableOpacity>
            <Text style={{ color: 'white', fontSize: 18, fontFamily: 'Tajawal-Bold' }}>اختر سورة وآية</Text>
            <View style={{ width: 36 }} />
          </View>

          <FlatList
            data={SURAHS}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isExpanded = expandedSurah === item.id;
              const isActiveSurah = currentSurah === item.id;
              return (
                <View>
                  {/* Surah row */}
                  <TouchableOpacity
                    onPress={() => setExpandedSurah(isExpanded ? null : item.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255,255,255,0.05)',
                      backgroundColor: isActiveSurah ? 'rgba(16,185,129,0.08)' : 'transparent',
                    }}
                  >
                    <ChevronDown
                      color={isExpanded ? '#10B981' : 'rgba(255,255,255,0.3)'}
                      size={16}
                      style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                    />
                    <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 12 }}>
                      <Text style={{ color: isActiveSurah ? '#34D399' : 'white', fontFamily: 'Amiri', fontSize: 17 }}>
                        {item.name}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Tajawal', fontSize: 12, marginTop: 2 }}>
                        {item.verses} آية
                      </Text>
                    </View>
                    <View style={{ width: 32, height: 32, backgroundColor: isActiveSurah ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                      <Text style={{ color: isActiveSurah ? '#34D399' : 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal', fontSize: 13 }}>
                        {item.id}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Ayah grid */}
                  {isExpanded && (
                    <View style={{ backgroundColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                      {Array.from({ length: item.verses }, (_, i) => i + 1).map((ayah) => {
                        const isActiveAyah = isActiveSurah && currentAyah === ayah;
                        return (
                          <TouchableOpacity
                            key={ayah}
                            onPress={() => { onSelect(item.id, ayah); onClose(); }}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 10,
                              backgroundColor: isActiveAyah ? '#10B981' : 'rgba(255,255,255,0.06)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 1,
                              borderColor: isActiveAyah ? '#10B981' : 'rgba(255,255,255,0.08)',
                            }}
                          >
                            <Text style={{ color: isActiveAyah ? 'white' : 'rgba(255,255,255,0.7)', fontFamily: 'Tajawal', fontSize: 14 }}>
                              {ayah}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

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
  const [currentSurahId, setCurrentSurahId] = useState(surahId);
  const [navVisible, setNavVisible] = useState(false);

  const { surah: currentSurahData, isLoading: currentSurahLoading } = useQuran(currentSurahId);

  const ayahData = currentSurahData?.ayahs.find((a) => a.number === currentAyah);
  const totalAyahs = currentSurahData?.verses ?? 0;

  useEffect(() => {
    if (currentSurahLoading || !currentSurahData) return;
    if (!ayahData?.text) {
      setError('لم يتم العثور على نص الآية.');
      return;
    }

    let cancelled = false;
    setTafseerText(null);
    setError(null);
    setIsLoadingTafseer(true);

    generateTafseer({
      surahNumber: currentSurahId,
      ayahNumber: currentAyah,
      ayahText: ayahData.text,
      language: 'ar',
    })
      .then((text) => { if (!cancelled) setTafseerText(text); })
      .catch((err) => {
        console.error('Tafseer Fetch Error:', err);
        if (!cancelled) setError('تعذّر تحميل التفسير. تحقق من اتصالك بالإنترنت.');
      })
      .finally(() => { if (!cancelled) setIsLoadingTafseer(false); });

    return () => { cancelled = true; };
  }, [currentSurahId, currentAyah, currentSurahLoading, ayahData?.text]);

  const goPrev = () => { if (currentAyah > 1) setCurrentAyah((n) => n - 1); };
  const goNext = () => { if (currentAyah < totalAyahs) setCurrentAyah((n) => n + 1); };

  const handleNavSelect = (newSurah: number, newAyah: number) => {
    if (newSurah !== currentSurahId) {
      setCurrentSurahId(newSurah);
    }
    setCurrentAyah(newAyah);
  };

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>

      {/* Header */}
      <BlurView intensity={20} tint="dark" className="pt-16 pb-4 px-4 flex-row justify-between items-center border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()} className="p-2 border border-white/10 rounded-full">
          <ChevronRight color="white" size={24} />
        </TouchableOpacity>
        <View className="items-center flex-1">
          <Text className="text-white font-amiri text-xl">
            {currentSurahData?.name ?? `سورة ${currentSurahId}`}
          </Text>
          <Text className="text-emerald-400 font-tajawal text-xs mt-0.5">
            الآية {currentAyah} من {totalAyahs}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setNavVisible(true)}
          className="w-10 h-10 bg-emerald-500/20 rounded-full items-center justify-center border border-emerald-500/30"
        >
          <BookOpen color="#34D399" size={18} />
        </TouchableOpacity>
      </BlurView>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 24, paddingBottom: 120 }}>

        {/* Ayah text card */}
        {currentSurahLoading ? (
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
                onPress={() => setCurrentAyah((n) => n)}
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

      {/* Surah + Ayah navigator modal */}
      <SurahNavigatorModal
        visible={navVisible}
        currentSurah={currentSurahId}
        currentAyah={currentAyah}
        onSelect={handleNavSelect}
        onClose={() => setNavVisible(false)}
      />
    </View>
  );
}
