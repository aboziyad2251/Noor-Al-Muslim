import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, RefreshCw, Play, Pause, Square, Mic } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { useQuran } from '../../hooks/useQuran';
import { useQuranAudio } from '../../hooks/useQuranAudio';
import { useKhatm } from '../../hooks/useKhatm';
import { RECITERS } from '../../lib/reciters';
import { logQuranReading } from '../../lib/ibadah-log';

export default function SurahReader() {
  const { surah } = useLocalSearchParams();
  const router = useRouter();
  const surahId = parseInt(surah as string, 10);

  const { surah: data, isLoading, error, refetch } = useQuran(surahId);
  const {
    playbackState, currentAyah, isPlayingAll,
    play, playAll, pause, resume, stop,
    selectedReciter, selectReciter,
  } = useQuranAudio();
  const { markSurahRead, setLastRead, progress } = useKhatm();
  const isRead = progress.completedSurahs.includes(surahId);

  const [showReciterPicker, setShowReciterPicker] = useState(false);

  const handleAyahAudio = async (ayahNum: number) => {
    if (currentAyah === ayahNum && playbackState === 'playing') {
      await pause();
    } else if (currentAyah === ayahNum && playbackState === 'paused') {
      await resume();
    } else {
      await play(surahId, ayahNum);
    }
  };

  const handleSurahPlay = async () => {
    if (playbackState === 'playing' || playbackState === 'loading') {
      await stop();
    } else {
      await playAll(surahId, data?.ayahs.length ?? 1, 1);
    }
  };

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>

      {/* Header */}
      <BlurView intensity={20} tint="dark" className="pt-16 pb-4 px-4 border-b border-white/5">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => { stop(); router.back(); }} className="p-2 border border-white/10 rounded-full">
            <ChevronRight color="white" size={24} />
          </TouchableOpacity>

          <View className="items-center flex-1">
            {data ? (
              <>
                <Text className="text-white font-amiri text-2xl mb-1">{data.name}</Text>
                <Text className="text-emerald-400 font-tajawal text-xs font-bold">
                  {data.type} • {data.verses} آيات
                </Text>
              </>
            ) : (
              <Text className="text-white font-tajawal text-base">جارٍ التحميل...</Text>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            {/* Reciter selector button */}
            <TouchableOpacity
              onPress={() => setShowReciterPicker(true)}
              className="w-10 h-10 rounded-full items-center justify-center border border-white/20 bg-white/5"
            >
              <Mic color="#94A3B8" size={15} />
            </TouchableOpacity>

            {/* Play whole surah */}
            <TouchableOpacity
              onPress={handleSurahPlay}
              className="w-10 h-10 rounded-full items-center justify-center border border-emerald-500/40 bg-emerald-500/20"
            >
              {playbackState === 'loading' && isPlayingAll ? (
                <ActivityIndicator color="#10B981" size="small" />
              ) : isPlayingAll && playbackState === 'playing' ? (
                <Square color="#10B981" size={16} />
              ) : (
                <Play color="#10B981" size={16} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Active reciter label */}
        <View className="items-center mt-2">
          <Text className="text-slate-500 font-tajawal text-xs">
            القارئ: <Text className="text-slate-400">{selectedReciter.nameAr}</Text>
          </Text>
        </View>
      </BlurView>

      {/* Loading state */}
      {isLoading && (
        <View className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator color="#10B981" size="large" />
          <Text className="text-slate-400 font-tajawal text-sm">جارٍ تحميل السورة...</Text>
        </View>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <Text className="text-slate-400 font-tajawal text-center text-base leading-8">{error}</Text>
          <TouchableOpacity
            onPress={refetch}
            className="flex-row items-center gap-2 bg-emerald-500/20 px-6 py-3 rounded-2xl border border-emerald-500/30"
          >
            <RefreshCw color="#34D399" size={18} />
            <Text className="text-emerald-400 font-tajawal font-bold">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ayahs */}
      {data && !isLoading && (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 24, paddingBottom: 120 }}
        >
          {/* Basmala */}
          {surahId !== 1 && surahId !== 9 && (
            <View className="mb-6 items-center p-4 border border-emerald-500/20 rounded-3xl bg-emerald-900/10">
              <Text className="font-amiri text-2xl text-emerald-400">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Text>
            </View>
          )}

          {data.ayahs.map((ayah) => {
            const isPlaying = currentAyah === ayah.number && playbackState === 'playing';
            const isThisLoading = currentAyah === ayah.number && playbackState === 'loading';
            const isActive = currentAyah === ayah.number;

            return (
              <View
                key={ayah.number}
                className={`mb-3 rounded-2xl p-4 border ${isActive ? 'border-emerald-500/40 bg-emerald-900/10' : 'border-white/5 bg-white/5'}`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <TouchableOpacity
                    onPress={() => handleAyahAudio(ayah.number)}
                    className="w-8 h-8 rounded-full items-center justify-center border border-white/10 bg-white/5"
                  >
                    {isThisLoading ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : isPlaying ? (
                      <Pause color="#10B981" size={14} />
                    ) : (
                      <Play color={isActive ? '#10B981' : '#64748B'} size={14} />
                    )}
                  </TouchableOpacity>

                  <View className="w-7 h-7 rounded-full items-center justify-center border border-emerald-500/30 bg-emerald-500/10">
                    <Text className="text-emerald-400 font-tajawal text-xs font-bold">{ayah.number}</Text>
                  </View>
                </View>

                <Text
                  className="text-white font-amiri text-2xl leading-[3rem] text-right"
                  style={{ writingDirection: 'rtl' }}
                >
                  {ayah.text}
                </Text>
              </View>
            );
          })}

          <TouchableOpacity
            onPress={() => { markSurahRead(surahId); logQuranReading(); }}
            className={`mb-3 rounded-2xl p-4 flex-row items-center justify-center border gap-2 ${
              isRead ? 'border-emerald-500/30 bg-emerald-900/20' : 'border-white/10 bg-white/5'
            }`}
          >
            <Text className={`font-tajawal font-bold ${isRead ? 'text-emerald-400' : 'text-white'}`}>
              {isRead ? '✓ تمّت قراءة السورة' : 'علّم السورة كمقروءة'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 bg-[#1E293B] border border-white/10 rounded-2xl p-4 flex-row items-center justify-between"
            onPress={() => router.push(`/tafseer/${surahId}/1`)}
          >
            <View>
              <Text className="text-white font-tajawal font-bold mb-1">اقرأ التفسير</Text>
              <Text className="text-slate-400 font-tajawal text-xs">تفسير مُفصّل بالذكاء الاصطناعي</Text>
            </View>
            <View className="w-10 h-10 bg-emerald-500/20 rounded-full items-center justify-center border border-emerald-500/30">
              <ChevronRight color="#34D399" size={18} style={{ transform: [{ rotate: '180deg' }] }} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Reciter Picker Modal */}
      <Modal
        visible={showReciterPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReciterPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setShowReciterPicker(false)}
        />
        <View className="bg-[#1E293B] rounded-t-3xl border-t border-white/10 px-6 pt-6 pb-10">
          <View className="w-12 h-1 bg-white/20 rounded-full self-center mb-6" />
          <Text className="text-white font-tajawal font-bold text-lg mb-4 text-center">اختر القارئ</Text>

          <View className="gap-2">
            {RECITERS.map((reciter) => {
              const isSelected = reciter.id === selectedReciter.id;
              return (
                <TouchableOpacity
                  key={reciter.id}
                  onPress={async () => {
                    await selectReciter(reciter.id);
                    setShowReciterPicker(false);
                  }}
                  className={`p-4 rounded-2xl flex-row items-center justify-between border ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <View>
                    <Text className={`font-tajawal font-bold text-base ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                      {reciter.nameAr}
                    </Text>
                    <Text className="text-slate-500 font-tajawal text-xs mt-0.5">{reciter.nameEn}</Text>
                  </View>
                  {isSelected && (
                    <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center">
                      <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

    </View>
  );
}
