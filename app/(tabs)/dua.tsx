import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { Heart, BookOpen, ChevronLeft, ChevronRight, RefreshCw, Trophy, Mic, MicOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { logAzkarCompletion } from '../../lib/ibadah-log';
import { useVoiceDhikr } from '../../hooks/useVoiceDhikr';

// @ts-ignore
import { AZKAR_BY_CATEGORY, CATEGORIES } from '../../data/azkar';

function DuaReader({ categoryId, onBack }: { categoryId: string; onBack: () => void }) {
  const azkarList = (AZKAR_BY_CATEGORY as Record<string, any[]>)[categoryId] || [];
  const categoryMeta = CATEGORIES.find((c: any) => c.id === categoryId);
  const categoryTitle = categoryMeta?.title || categoryId;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [counters, setCounters] = useState(azkarList.map((z: any) => z.count || 1));
  const [isCompleting, setIsCompleting] = useState(false);

  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  const { isListening, isSupported: voiceSupported, start: startVoice, stop: stopVoice } = useVoiceDhikr(
    useCallback(() => {
      // Called when a voice spike is detected — same logic as handleCount
      const idx = currentIndexRef.current;
      setCounters((prev) => {
        if (prev[idx] <= 0) return prev;
        const next = [...prev];
        next[idx]--;
        if (next[idx] === 0 && idx < azkarList.length - 1) {
          setIsCompleting(true);
          setTimeout(() => {
            setIsCompleting(false);
            setCurrentIndex((i) => Math.min(i + 1, azkarList.length - 1));
          }, 1400);
        }
        return next;
      });
    }, [azkarList.length])
  );

  // Stop listening when navigating away or category completes
  useEffect(() => {
    return () => { stopVoice(); };
  }, []);

  useEffect(() => {
    if (allDone) stopVoice();
  }, [allDone]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const zikr = azkarList[currentIndex];
  const remaining = counters[currentIndex] ?? 0;
  const total = zikr?.count ?? 1;
  const isCurrentDone = remaining === 0;
  const allDone = counters.every((c) => c === 0);

  // Log azkar completion to ibadah heatmap when the category is fully done
  useEffect(() => {
    if (allDone) logAzkarCompletion();
  }, [allDone]);
  const completedCount = counters.filter((c) => c === 0).length;

  useEffect(() => {
    if (isCurrentDone && !allDone) {
      Animated.spring(checkAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 6,
      }).start();
    } else {
      checkAnim.setValue(0);
    }
  }, [currentIndex, isCurrentDone, allDone]);

  const animatePulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const goToNext = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx < azkarList.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setCurrentIndex(idx + 1);
        checkAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    }
  }, [azkarList.length]);

  const handleCount = useCallback(() => {
    if (isCompleting || isCurrentDone) return;
    const idx = currentIndexRef.current;
    setCounters((prev) => {
      const next = [...prev];
      if (next[idx] > 0) {
        next[idx]--;
        animatePulse();
        if (next[idx] === 0 && idx < azkarList.length - 1) {
          setIsCompleting(true);
          setTimeout(() => {
            setIsCompleting(false);
            goToNext();
          }, 1400);
        }
      }
      return next;
    });
  }, [isCompleting, azkarList.length, goToNext, isCurrentDone]);

  const handleReset = () => {
    setCounters(azkarList.map((z: any) => z.count || 1));
    setCurrentIndex(0);
    setIsCompleting(false);
    checkAnim.setValue(0);
    fadeAnim.setValue(1);
  };

  if (!zikr) return null;

  const progressPct = completedCount / azkarList.length;

  if (allDone) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <Trophy color="#10B981" size={72} strokeWidth={1.5} className="mb-4" />
        <Text className="text-emerald-400 text-4xl font-bold mb-2">أحسنت!</Text>
        <Text className="text-slate-300 text-xl text-center mb-8">لقد أتممت {categoryTitle}</Text>
        
        <View className="bg-emerald-900/20 p-6 rounded-3xl border-l-4 border-emerald-500 w-full mb-10">
          <Text className="text-emerald-300 text-xl font-bold text-center leading-10" style={{ writingDirection: 'rtl' }}>
            وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleReset}
          className="bg-emerald-600 px-8 py-4 rounded-full w-full mb-4 shadow-sm flex-row justify-center items-center"
        >
          <Text className="text-white font-bold text-lg mr-2">إعادة من البداية</Text>
          <RefreshCw color="white" size={20} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onBack} className="p-4 w-full items-center">
          <Text className="text-emerald-500 text-lg">العودة للقائمة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-16 pb-4 bg-slate-900 border-b border-slate-800 shadow-sm z-10">
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={handleReset} className="w-12 h-12 items-center justify-center rounded-full bg-slate-800">
            <RefreshCw color="#10B981" size={22} />
          </TouchableOpacity>
          {voiceSupported && (
            <TouchableOpacity
              onPress={isListening ? stopVoice : startVoice}
              className="w-12 h-12 items-center justify-center rounded-full"
              style={{ backgroundColor: isListening ? '#10B98133' : '#1E293B', borderWidth: 1, borderColor: isListening ? '#10B981' : '#334155' }}
            >
              {isListening ? <Mic color="#10B981" size={20} /> : <MicOff color="#64748B" size={20} />}
            </TouchableOpacity>
          )}
        </View>
        <Text className="text-white text-xl font-bold flex-1 text-center" style={{ writingDirection: 'rtl' }}>
          {categoryTitle}
        </Text>
        <TouchableOpacity onPress={onBack} className="w-12 h-12 items-center justify-center rounded-full bg-slate-800">
          <ChevronRight color="#10B981" size={26} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar & Label */}
      <View className="bg-slate-900 px-5 py-4 border-b border-slate-800 shadow-sm z-10">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-slate-400 font-bold text-sm">{completedCount} / {azkarList.length}</Text>
          <Text className="text-emerald-400 font-bold text-sm text-right">مستوى الإنجاز</Text>
        </View>
        <View className="h-2 bg-slate-800 rounded-full w-full overflow-hidden flex-row">
          <View 
            className="h-full bg-emerald-500 rounded-r-full absolute right-0"
            style={{ width: `${progressPct * 100}%` }}
            />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Card */}
        <Animated.View className="flex-1 p-5 py-8" style={{ opacity: fadeAnim }}>
          <Animated.View
            className={`flex-1 bg-slate-900 rounded-[32px] p-6 border shadow-lg ${
              isCurrentDone ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800'
            }`}
            style={{ transform: [{ scale: pulseAnim }] }}
          >
            <Text className="text-white text-3xl leading-[64px] font-bold text-center mb-6" style={{ writingDirection: 'rtl' }}>
              {zikr.arabic}
            </Text>

            {zikr.translation ? (
              <Text className="text-slate-400 text-center text-lg italic mb-6 leading-8">
                {zikr.translation}
              </Text>
            ) : null}

            {zikr.description ? (
              <View className="bg-emerald-950/30 p-4 rounded-xl border-l-4 border-emerald-500 mb-6">
                <Text className="text-emerald-100/80 text-right text-sm leading-6" style={{ writingDirection: 'rtl' }}>
                  {zikr.description}
                </Text>
              </View>
            ) : null}

            {zikr.reference ? (
              <Text className="text-slate-500 text-center text-sm">📖 {zikr.reference}</Text>
            ) : null}

            {isCurrentDone && (
              <Animated.View
                className="absolute bottom-6 self-center bg-emerald-500 px-6 py-2 rounded-full shadow-lg"
                style={{ transform: [{ scale: checkAnim }] }}
              >
                <Text className="text-white font-bold text-lg">✓ أحسنت</Text>
              </Animated.View>
            )}
          </Animated.View>
        </Animated.View>

        {/* Counter Area */}
        <View className="items-center pb-8">
          <TouchableOpacity
            onPress={handleCount}
            activeOpacity={0.8}
            disabled={isCurrentDone}
            className="mb-4"
          >
            <View className={`w-32 h-32 rounded-full border-[3px] items-center justify-center p-2 shadow-xl ${
              isCurrentDone ? 'border-emerald-500/0' : 'border-emerald-500/30'
            }`}>
              <View className={`w-full h-full rounded-full items-center justify-center ${
                isCurrentDone ? 'bg-emerald-500' : 'bg-emerald-600'
              }`}>
                {isCurrentDone ? (
                  <Text className="text-white text-5xl font-bold">✓</Text>
                ) : (
                  <>
                    <Text className="text-white text-5xl font-bold">{remaining}</Text>
                    <Text className="text-emerald-200/80 text-sm mt-1">/ {total}</Text>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text className="text-slate-500 text-sm">
            {isCurrentDone ? 'انتقال تلقائي...' : isListening ? 'قل الذكر بصوت واضح...' : 'اضغط للتسبيح'}
          </Text>
          {isListening && !isCurrentDone && (
            <View className="flex-row items-center gap-2 mt-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/30">
              <View className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Text className="text-emerald-400 font-tajawal text-xs">الميكروفون يستمع</Text>
            </View>
          )}
        </View>

        {/* Prev / Next Nav */}
        <View className="flex-row justify-between items-center px-6 pb-10">
          <TouchableOpacity
            disabled={currentIndex === azkarList.length - 1}
            onPress={goToNext}
            className={`px-5 py-3 rounded-2xl bg-slate-800 flex-row items-center border border-slate-700 ${
              currentIndex === azkarList.length - 1 ? 'opacity-30' : ''
            }`}
          >
            <ChevronLeft color="#10B981" size={20} />
            <Text className="text-emerald-400 text-sm ml-1 font-bold">التالي</Text>
          </TouchableOpacity>

          <Text className="text-slate-500 font-bold">
            {currentIndex + 1} / {azkarList.length}
          </Text>

          <TouchableOpacity
            disabled={currentIndex === 0}
            onPress={() => {
              if (currentIndex > 0) {
                fadeAnim.setValue(0);
                setCurrentIndex((i) => i - 1);
                checkAnim.setValue(0);
                Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
              }
            }}
            className={`px-5 py-3 rounded-2xl bg-slate-800 flex-row items-center border border-slate-700 ${
              currentIndex === 0 ? 'opacity-30' : ''
            }`}
          >
            <Text className="text-emerald-400 text-sm mr-1 font-bold">السابق</Text>
            <ChevronRight color="#10B981" size={20} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default function DuaScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeCategories = CATEGORIES.filter(
    (c: any) => (AZKAR_BY_CATEGORY as Record<string, any[]>)[c.id]?.length > 0
  );

  if (selectedCategory) {
    return <DuaReader categoryId={selectedCategory} onBack={() => setSelectedCategory(null)} />;
  }

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-16 pb-6 bg-slate-900 border-b border-slate-800 shadow-sm relative z-10">
        <View className="w-10 h-10 items-center justify-center bg-slate-800 rounded-full">
          <Heart color="#10B981" size={20} />
        </View>
        <Text className="text-white text-2xl font-bold flex-1 text-center" style={{ writingDirection: 'rtl' }}>
          الأذكار والأدعية
        </Text>
        <View className="w-10 h-10 items-center justify-center bg-emerald-500/20 rounded-full border border-emerald-500/30">
          <BookOpen color="#10B981" size={20} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <Text className="text-slate-400 text-right font-medium mb-6">اختر الفئة للقراءة والاستماع</Text>
        
        {activeCategories.map((cat: any) => (
          <TouchableOpacity 
            key={cat.id} 
            onPress={() => setSelectedCategory(cat.id)}
            activeOpacity={0.8}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-4 flex-row justify-between items-center shadow-sm"
          >
            <View className="bg-slate-800 p-2 rounded-full">
              <ChevronLeft color="#10B981" size={24} />
            </View>
            <View className="items-end flex-1 pl-4">
              <View className="flex-row items-center mb-1">
                <Text className="text-white text-xl font-bold mr-3">{cat.title}</Text>
                <Text className="text-2xl">{cat.icon || '📖'}</Text>
              </View>
              <Text className="text-slate-400 text-sm">{cat.subtitle || 'عرض وقراءة الأدعية'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}