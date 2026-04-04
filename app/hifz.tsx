import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, FlatList, TextInput,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ChevronRight, BookOpen, Plus, Trash2, Brain, Star, RefreshCw, Lock, Search } from 'lucide-react-native';
import { useHifz, HifzEntry, ReviewRating } from '../hooks/useHifz';
import { useAuthStore } from '../store/useAuthStore';
import SURAHS from '../assets/data/surahs.json';

const INTERVAL_LABEL: Record<number, string> = {
  1: 'غداً', 3: 'بعد ٣ أيام', 7: 'بعد أسبوع',
  14: 'بعد أسبوعين', 30: 'بعد شهر', 60: 'بعد شهرين', 120: 'بعد ٤ أشهر',
};

function nextLabel(days: number): string {
  return INTERVAL_LABEL[days] ?? `بعد ${days} يوم`;
}

function DueCard({ entry, onReview, onTip }: {
  entry: HifzEntry;
  onReview: (entry: HifzEntry, rating: ReviewRating) => void;
  onTip: (entry: HifzEntry) => void;
}) {
  const [rated, setRated] = useState(false);

  const rate = (rating: ReviewRating) => {
    setRated(true);
    onReview(entry, rating);
  };

  return (
    <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 bg-emerald-500/20 rounded-xl items-center justify-center">
            <Text className="text-emerald-400 font-tajawal font-bold text-xs">{entry.surahNumber}</Text>
          </View>
          <Text className="text-white font-amiri text-lg">{entry.surahName}</Text>
        </View>
        <TouchableOpacity onPress={() => onTip(entry)} className="flex-row items-center gap-1 bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/30">
          <Brain color="#818CF8" size={14} />
          <Text className="text-indigo-400 font-tajawal text-xs">نصيحة</Text>
        </TouchableOpacity>
      </View>

      {rated ? (
        <View className="items-center py-2">
          <Text className="text-emerald-400 font-tajawal text-sm">✓ تمت المراجعة</Text>
          <Text className="text-slate-500 font-tajawal text-xs mt-1">{nextLabel(entry.intervalDays)}</Text>
        </View>
      ) : (
        <View>
          <Text className="text-slate-400 font-tajawal text-xs mb-2 text-center">كيف كانت مراجعتك؟</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => rate('hard')} className="flex-1 bg-red-500/20 border border-red-500/30 py-2 rounded-xl items-center">
              <Text className="text-red-400 font-tajawal text-sm font-bold">صعب</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => rate('medium')} className="flex-1 bg-amber-500/20 border border-amber-500/30 py-2 rounded-xl items-center">
              <Text className="text-amber-400 font-tajawal text-sm font-bold">متوسط</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => rate('easy')} className="flex-1 bg-emerald-500/20 border border-emerald-500/30 py-2 rounded-xl items-center">
              <Text className="text-emerald-400 font-tajawal text-sm font-bold">سهل</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function ScheduleCard({ entry, onRemove, onTip }: {
  entry: HifzEntry;
  onRemove: (n: number) => void;
  onTip: (entry: HifzEntry) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const isDue = entry.nextReviewDate <= today;

  return (
    <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-2 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-9 h-9 bg-emerald-500/20 rounded-xl items-center justify-center">
          <Text className="text-emerald-400 font-tajawal font-bold text-xs">{entry.surahNumber}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-amiri text-base">{entry.surahName}</Text>
          <Text className="text-slate-500 font-tajawal text-xs">
            {isDue ? '🔴 موعد المراجعة اليوم' : `التالي: ${nextLabel(entry.intervalDays)}`}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity onPress={() => onTip(entry)} className="w-8 h-8 bg-indigo-500/10 rounded-xl items-center justify-center">
          <Brain color="#818CF8" size={16} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onRemove(entry.surahNumber)} className="w-8 h-8 bg-red-500/10 rounded-xl items-center justify-center">
          <Trash2 color="#EF4444" size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HifzScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { schedule, dueToday, isLoading, tip, tipLoading, addSurah, removeSurah, markReviewed, fetchTip, clearTip, refresh } = useHifz();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  const [tipEntry, setTipEntry] = useState<HifzEntry | null>(null);
  const [query, setQuery] = useState('');

  const addedNumbers = new Set(schedule.map((e) => e.surahNumber));
  const filtered = SURAHS.filter((s: any) =>
    s.name.includes(query) || s.nameEn.toLowerCase().includes(query.toLowerCase())
  );

  const openTip = (entry: HifzEntry) => {
    setTipEntry(entry);
    setTipVisible(true);
    fetchTip(entry);
  };

  const closeTip = () => {
    setTipVisible(false);
    clearTip();
    setTipEntry(null);
  };

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      {/* Header */}
      <BlurView intensity={20} tint="dark" className="pt-16 pb-4 px-5 flex-row items-center justify-between border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
          <ChevronRight color="#94A3B8" size={20} />
        </TouchableOpacity>
        <View className="items-center flex-1">
          <Text className="text-white font-amiri text-2xl">مسار الحفظ الذكي</Text>
          <Text className="text-slate-400 font-tajawal text-xs mt-0.5">مراجعة بتقنية التكرار المتباعد</Text>
        </View>
        <TouchableOpacity onPress={refresh} disabled={isLoading} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
          <RefreshCw color="#94A3B8" size={18} />
        </TouchableOpacity>
      </BlurView>

      {/* Not signed in */}
      {!session && (
        <View className="flex-1 items-center justify-center px-8 gap-5">
          <Lock color="#64748B" size={48} strokeWidth={1.5} />
          <Text className="text-white font-tajawal font-bold text-xl text-center">سجّل دخولك لبدء الحفظ</Text>
          <Text className="text-slate-400 font-tajawal text-sm text-center leading-6">
            مسار الحفظ يحتاج إلى حسابك لحفظ جدولك ومراجعاتك على الخادم.
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth')} className="bg-emerald-500 px-8 py-3 rounded-full">
            <Text className="text-white font-tajawal font-bold text-base">تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      )}

      {session && (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>

          {/* Stats row */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 items-center">
              <Text className="text-white font-tajawal font-bold text-2xl">{schedule.length}</Text>
              <Text className="text-slate-400 font-tajawal text-xs mt-1 text-center">سور محفوظة</Text>
            </View>
            <View className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 items-center">
              <Text className="text-emerald-400 font-tajawal font-bold text-2xl">{dueToday.length}</Text>
              <Text className="text-slate-400 font-tajawal text-xs mt-1 text-center">مراجعة اليوم</Text>
            </View>
            <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 items-center">
              <Text className="text-white font-tajawal font-bold text-2xl">
                {schedule.reduce((sum, e) => sum + e.repetitions, 0)}
              </Text>
              <Text className="text-slate-400 font-tajawal text-xs mt-1 text-center">إجمالي المراجعات</Text>
            </View>
          </View>

          {/* Due Today */}
          {dueToday.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center gap-2 mb-3">
                <Star color="#F59E0B" size={16} />
                <Text className="text-amber-400 font-tajawal font-bold text-base">مراجعة اليوم</Text>
              </View>
              {dueToday.map((entry) => (
                <DueCard key={entry.id} entry={entry} onReview={markReviewed} onTip={openTip} />
              ))}
            </View>
          )}

          {/* All schedule */}
          {schedule.length > 0 && (
            <View className="mb-6">
              <Text className="text-slate-400 font-tajawal text-sm mb-3">كل السور</Text>
              {schedule.map((entry) => (
                <ScheduleCard key={entry.id} entry={entry} onRemove={removeSurah} onTip={openTip} />
              ))}
            </View>
          )}

          {/* Empty state */}
          {!isLoading && schedule.length === 0 && (
            <View className="items-center py-12 gap-4">
              <BookOpen color="#334155" size={48} strokeWidth={1.5} />
              <Text className="text-slate-400 font-tajawal text-center leading-7">
                أضف أول سورة لبدء رحلة الحفظ{'\n'}وسنذكّرك بالمراجعة في الوقت المناسب
              </Text>
            </View>
          )}

          {/* Add surah button */}
          <TouchableOpacity
            onPress={() => setPickerVisible(true)}
            className="flex-row items-center justify-center gap-2 bg-emerald-500 py-4 rounded-2xl mt-2"
          >
            <Plus color="white" size={20} />
            <Text className="text-white font-tajawal font-bold text-base">إضافة سورة للحفظ</Text>
          </TouchableOpacity>

        </ScrollView>
      )}

      {/* Surah Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerVisible(false)}>
        <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
          <View className="pt-6 px-5 pb-4 border-b border-white/10">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Text className="text-slate-400 font-tajawal text-base">إغلاق</Text>
              </TouchableOpacity>
              <Text className="text-white font-amiri text-xl">اختر سورة</Text>
              <View className="w-16" />
            </View>
            <View className="flex-row items-center bg-white/10 rounded-xl px-3 gap-2">
              <Search color="#64748B" size={16} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="ابحث..."
                placeholderTextColor="#64748B"
                className="flex-1 text-white font-tajawal py-3"
                style={{ textAlign: 'right' }}
              />
            </View>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item: any) => String(item.id)}
            renderItem={({ item }: { item: any }) => {
              const added = addedNumbers.has(item.id);
              return (
                <TouchableOpacity
                  onPress={() => { if (!added) { addSurah(item.id, item.name); setPickerVisible(false); setQuery(''); } }}
                  disabled={added}
                  className="flex-row items-center px-5 py-3 border-b border-white/5"
                >
                  <View className="w-9 h-9 bg-white/5 rounded-xl items-center justify-center ml-3">
                    <Text className="text-slate-400 font-tajawal text-xs">{item.id}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-amiri text-lg ${added ? 'text-slate-600' : 'text-white'}`}>{item.name}</Text>
                    <Text className="text-slate-500 font-tajawal text-xs">{item.verses} آية • {item.type}</Text>
                  </View>
                  {added && <Text className="text-emerald-600 font-tajawal text-xs">مضافة ✓</Text>}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </Modal>

      {/* Tajweed Tip Modal */}
      <Modal visible={tipVisible} animationType="fade" transparent onRequestClose={closeTip}>
        <TouchableOpacity className="flex-1 bg-black/70 items-center justify-center px-6" activeOpacity={1} onPress={closeTip}>
          <TouchableOpacity activeOpacity={1} className="w-full">
            <View className="rounded-3xl overflow-hidden border border-indigo-500/30">
              <BlurView intensity={30} tint="dark" className="p-6 bg-indigo-900/20">
                <View className="flex-row items-center gap-2 mb-4">
                  <Brain color="#818CF8" size={20} />
                  <Text className="text-indigo-400 font-tajawal font-bold text-base">
                    نصيحة الحفظ — {tipEntry?.surahName}
                  </Text>
                </View>
                {tipLoading ? (
                  <View className="items-center py-8 gap-3">
                    <ActivityIndicator color="#818CF8" size="large" />
                    <Text className="text-slate-400 font-tajawal text-sm">نور يُعدّ نصيحتك...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-tajawal text-base leading-8" style={{ writingDirection: 'rtl' }}>
                    {tip}
                  </Text>
                )}
                <TouchableOpacity onPress={closeTip} className="mt-5 bg-white/10 py-3 rounded-2xl items-center">
                  <Text className="text-slate-300 font-tajawal font-bold">إغلاق</Text>
                </TouchableOpacity>
              </BlurView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
