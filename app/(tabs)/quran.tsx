import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Search, PlayCircle, BookOpen } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import SURAHS_DATA from '../../assets/data/surahs.json';
import { useKhatm } from '../../hooks/useKhatm';

interface Surah {
  id: number;
  name: string;
  nameEn: string;
  verses: number;
  type: string;
  page: number;
  juz: number;
}

const SURAHS: Surah[] = SURAHS_DATA as Surah[];

export default function QuranScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'surahs' | 'juz'>('surahs');
  const { completedCount, percentComplete, progress } = useKhatm();

  const filtered = useMemo(() => {
    if (!query.trim()) return SURAHS;
    const q = query.trim();
    return SURAHS.filter(
      (s) =>
        s.name.includes(q) ||
        s.nameEn.toLowerCase().includes(q.toLowerCase()) ||
        String(s.id) === q
    );
  }, [query]);

  // Group by juz for the Juz tab
  const juzGroups = useMemo(() => {
    const groups: Record<number, Surah[]> = {};
    SURAHS.forEach((s) => {
      if (!groups[s.juz]) groups[s.juz] = [];
      groups[s.juz].push(s);
    });
    return groups;
  }, []);

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View className="px-6 pt-16 pb-4">
          <Text className="text-white text-3xl font-amiri mb-6">القرآن الكريم</Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-4 py-3">
            <Search color="#94A3B8" size={20} />
            <TextInput
              placeholder="ابحث عن سورة..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
              className="flex-1 text-white font-tajawal ml-3"
              style={{ textAlign: 'right' }}
            />
          </View>
        </View>

        {/* Continue Reading + Khatm Progress */}
        {!query && (
          <View className="px-6 mb-8 gap-4">
            {/* Continue reading — jump to last read surah if exists, else Al-Kahf */}
            <Text className="text-white/80 font-tajawal text-sm font-bold">متابعة القراءة</Text>
            <TouchableOpacity
              onPress={() => router.push(`/quran/${progress.lastReadSurah ?? 18}`)}
              className="rounded-3xl overflow-hidden border border-emerald-500/20"
            >
              <BlurView intensity={20} tint="dark" className="p-6 flex-row justify-between items-center bg-emerald-900/20">
                <View>
                  <Text className="text-emerald-400 font-amiri text-2xl mb-1">
                    {SURAHS.find((s) => s.id === (progress.lastReadSurah ?? 18))?.name ?? 'سورة الكهف'}
                  </Text>
                  <Text className="text-slate-300 font-tajawal text-xs">
                    {progress.lastReadSurah ? `آخر موضع: الآية ${progress.lastReadAyah ?? 1}` : 'الجزء ١٥ • ص ٢٩٣'}
                  </Text>
                </View>
                <View className="w-12 h-12 bg-emerald-500 rounded-full items-center justify-center">
                  <PlayCircle color="white" size={24} />
                </View>
              </BlurView>
            </TouchableOpacity>

            {/* Khatm progress bar */}
            <View className="bg-[#1E293B] border border-white/10 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-slate-400 font-tajawal text-xs">{completedCount} / 114 سورة</Text>
                <View className="flex-row items-center gap-2">
                  <BookOpen color="#10B981" size={14} />
                  <Text className="text-white font-tajawal font-bold text-sm">ختمة القرآن</Text>
                </View>
              </View>
              {/* Progress bar */}
              <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                <View
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${percentComplete}%` }}
                />
              </View>
              <Text className="text-emerald-400 font-tajawal text-xs mt-2 text-left">
                {percentComplete}٪ مكتمل
              </Text>
            </View>
          </View>
        )}

        {/* Tabs — hidden during search */}
        {!query && (
          <View className="px-6 border-b border-white/10 mb-6 flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab('surahs')}
              className={`pb-3 flex-1 items-center border-b-2 ${activeTab === 'surahs' ? 'border-emerald-500' : 'border-transparent'}`}
            >
              <Text className={`font-tajawal font-bold ${activeTab === 'surahs' ? 'text-emerald-400' : 'text-slate-400'}`}>
                السور
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('juz')}
              className={`pb-3 flex-1 items-center border-b-2 ${activeTab === 'juz' ? 'border-emerald-500' : 'border-transparent'}`}
            >
              <Text className={`font-tajawal font-bold ${activeTab === 'juz' ? 'text-emerald-400' : 'text-slate-400'}`}>
                الأجزاء
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Surah list or Juz list */}
        <View className="px-4">
          {activeTab === 'surahs' || query ? (
            <>
              {filtered.length === 0 && (
                <Text className="text-slate-400 font-tajawal text-center py-10">
                  لا توجد نتائج لـ "{query}"
                </Text>
              )}
              {filtered.map((surah) => (
                <TouchableOpacity
                  key={surah.id}
                  onPress={() => router.push(`/quran/${surah.id}`)}
                  className="flex-row items-center justify-between p-4 mb-2 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 items-center justify-center bg-slate-800 rounded-full border border-white/10">
                      <Text className="text-slate-400 text-xs font-tajawal">{surah.id}</Text>
                    </View>
                    <View>
                      <Text className="text-white font-amiri text-xl">{surah.name}</Text>
                      <Text className="text-slate-400 font-tajawal text-xs">
                        {surah.type} • {surah.verses} آية
                      </Text>
                    </View>
                  </View>
                  <Text className="text-emerald-500/80 font-tajawal text-xs font-semibold">
                    ص {surah.page}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            // Juz view
            Object.entries(juzGroups).map(([juz, surahs]) => (
              <View key={juz} className="mb-4">
                <View className="flex-row items-center gap-3 mb-2 px-2">
                  <View className="w-8 h-8 bg-emerald-500/20 rounded-full items-center justify-center border border-emerald-500/30">
                    <Text className="text-emerald-400 text-xs font-tajawal font-bold">{juz}</Text>
                  </View>
                  <Text className="text-white/60 font-tajawal text-sm">الجزء {juz}</Text>
                </View>
                {surahs.map((surah) => (
                  <TouchableOpacity
                    key={surah.id}
                    onPress={() => router.push(`/quran/${surah.id}`)}
                    className="flex-row items-center justify-between p-4 mb-1 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 ml-4"
                  >
                    <View className="flex-row items-center gap-3">
                      <Text className="text-slate-500 font-tajawal text-xs w-6 text-center">{surah.id}</Text>
                      <Text className="text-white font-amiri text-lg">{surah.name}</Text>
                    </View>
                    <Text className="text-slate-500 font-tajawal text-xs">{surah.verses} آية</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}
