import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect, memo } from 'react';
import { BlurView } from 'expo-blur';
import { Bell, Moon, Star, BookOpen, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getTodayHijriArabic } from '../../lib/hijri';
import PrayerCard, { PrayerStatus } from '../../components/prayer/PrayerCard';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import { usePrayerLog } from '../../hooks/usePrayerLog';
import { useUmmahCounter } from '../../hooks/useUmmahCounter';
import DAILY_AYAHS from '../../assets/data/daily_ayahs.json';

// Isolated clock component — only this re-renders every second
const ClockDisplay = memo(function ClockDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const formattedSeconds = currentTime.toLocaleTimeString('ar-SA', { second: '2-digit' });

  return (
    <View className="items-center pt-20 pb-10">
      <BlurView intensity={40} tint="dark" className="px-10 py-10 rounded-[48px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/5">
        <View className="items-center">
          <Text className="text-white text-8xl font-bold font-amiri tracking-tighter shadow-sm">
            {formattedTime.split(' ')[0]}
          </Text>
          <View className="flex-row items-center gap-3 mt-[-10]">
            <Text className="text-emerald-400 font-tajawal text-xl font-bold uppercase">
              {formattedTime.split(' ')[1]}
            </Text>
            <View className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Text className="text-slate-400 font-tajawal text-lg opacity-80">
              {formattedSeconds} ثانية
            </Text>
          </View>
          <Text className="text-slate-500 font-tajawal text-xs mt-4 uppercase tracking-[4px] opacity-60">
            الوقت الحالي
          </Text>
        </View>
      </BlurView>
    </View>
  );
});

function getDailyAyah() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return DAILY_AYAHS[dayOfYear % DAILY_AYAHS.length];
}

export default function HomeScreen() {
  const router = useRouter();
  const hijriDate = getTodayHijriArabic();
  const gregorianDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const { prayers, nextPrayer, cityName, isLoading, error } = usePrayerTimes();
  const { todayLogs, logPrayer } = usePrayerLog();
  const { counts: ummahCounts } = useUmmahCounter();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Used only for countdown — separate from the clock component
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeRemaining = (targetDate: Date) => {
    const diffMs = targetDate.getTime() - currentTime.getTime();
    if (diffMs <= 0) return 'الآن';

    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    let res = '';
    if (hours > 0) {
      res += `${hours} ساعة `;
      if (minutes > 0) res += 'و ';
    }
    if (minutes > 0 || hours === 0) {
      res += `${minutes} دقيقة`;
    }
    return res;
  };

  const ayah = getDailyAyah();

  return (
    <ScrollView className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      {/* Hero Clock Section */}
      <ClockDisplay />

      {/* Header Info */}
      <View className="px-6 pb-6">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white text-3xl font-amiri mb-1">السلام عليكم</Text>
            <Text className="text-slate-400 font-tajawal text-sm">
              {gregorianDate} • {hijriDate}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings/notifications')}
            className="w-12 h-12 bg-white/10 rounded-full items-center justify-center border border-white/20"
          >
            <Bell color="#94A3B8" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Ayah Card */}
      <View className="px-6 mb-8">
        <View className="rounded-3xl overflow-hidden border border-white/10">
          <BlurView intensity={20} tint="dark" className="p-8 pb-10">
            <View className="absolute top-2 right-2 opacity-10">
              <Moon color="white" size={100} />
            </View>
            <Text className="text-white/80 font-tajawal text-xs mb-6 tracking-widest uppercase">
              آية اليوم
            </Text>
            <Text
              className="text-white text-2xl font-amiri leading-loose text-center mb-6"
              style={{ writingDirection: 'rtl' }}
            >
              "{ayah.text}"
            </Text>
            <Text className="text-[#F59E0B] font-tajawal text-sm text-center font-bold">
              [{ayah.ref}]
            </Text>
            <View className="flex-row justify-center mt-6">
              <View className="flex-row items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Star color="#F59E0B" size={16} />
                <Text className="text-white font-tajawal text-xs">حفظ</Text>
              </View>
            </View>
          </BlurView>
        </View>
      </View>

      {/* Friday Weekly Report Card */}
      {new Date().getDay() === 5 && (
        <View className="px-6 mb-6">
          <TouchableOpacity onPress={() => router.push('/weekly-report')} activeOpacity={0.85}>
            <View className="rounded-3xl overflow-hidden border border-emerald-500/30">
              <BlurView intensity={20} tint="dark" className="p-5 bg-emerald-900/10">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-12 h-12 bg-emerald-500/20 rounded-2xl items-center justify-center border border-emerald-500/30">
                      <BookOpen color="#10B981" size={22} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-emerald-400 font-tajawal font-bold text-base">🌟 يوم الجمعة المبارك</Text>
                      <Text className="text-slate-400 font-tajawal text-xs mt-0.5">تقريرك الروحاني الأسبوعي جاهز</Text>
                    </View>
                  </View>
                  <ChevronLeft color="#10B981" size={20} />
                </View>
              </BlurView>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Ummah Counter */}
      {ummahCounts && ummahCounts.total > 0 && (
        <View className="px-6 mb-6">
          <View className="rounded-3xl overflow-hidden border border-white/10">
            <BlurView intensity={15} tint="dark" className="p-5">
              <Text className="text-slate-400 font-tajawal text-xs text-center mb-3 tracking-widest uppercase">
                الأمة تصلي معك اليوم
              </Text>
              <Text className="text-white font-amiri text-3xl text-center mb-4">
                {ummahCounts.total.toLocaleString('ar-SA')} مسلم
              </Text>
              <View className="flex-row justify-between">
                {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((key) => (
                  <View key={key} className="items-center flex-1">
                    <Text className="text-emerald-400 font-tajawal font-bold text-sm">
                      {ummahCounts[key].toLocaleString('ar-SA')}
                    </Text>
                    <Text className="text-slate-500 font-tajawal text-[10px] mt-0.5">
                      {key === 'fajr' ? 'الفجر' : key === 'dhuhr' ? 'الظهر' : key === 'asr' ? 'العصر' : key === 'maghrib' ? 'المغرب' : 'العشاء'}
                    </Text>
                  </View>
                ))}
              </View>
            </BlurView>
          </View>
        </View>
      )}

      {/* Prayer Times Module */}
      <View className="px-6 mb-10">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-xl font-tajawal font-bold">مواقيت الصلاة</Text>
          <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
            <Text className="text-emerald-400 text-xs font-tajawal font-bold">{cityName}</Text>
          </View>
        </View>

        <View className="bg-[#1E293B] rounded-3xl p-4 border border-white/5">
          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#10B981" />
              <Text className="text-slate-400 font-tajawal text-sm mt-3">جارٍ تحديد موقعك...</Text>
            </View>
          ) : error ? (
            <View className="py-6 items-center">
              <Text className="text-red-400 font-tajawal text-sm">{error}</Text>
            </View>
          ) : (
            <>
              {/* Next prayer banner */}
              {nextPrayer && (
                <View className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20 flex-row justify-between items-center mb-6 shadow-sm">
                  <View>
                    <Text className="text-emerald-400 text-xs font-tajawal font-bold mb-2 uppercase tracking-widest">الصلاة القادمة</Text>
                    <View className="flex-row items-baseline gap-2">
                      <Text className="text-white font-amiri font-bold text-3xl">
                        {nextPrayer.arabicName}
                      </Text>
                      <Text className="text-slate-400 font-tajawal text-sm">
                        خلال
                      </Text>
                      <Text className="text-[#F59E0B] font-tajawal font-bold text-xl">
                        {formatTimeRemaining(nextPrayer.time)}
                      </Text>
                    </View>
                  </View>
                  <View className="w-12 h-12 border-[3px] border-emerald-500/10 rounded-full border-t-emerald-500 flex items-center justify-center">
                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  </View>
                </View>
              )}

              {/* Prayer list */}
              {prayers.map((prayer) => (
                <PrayerCard
                  key={prayer.arabicName}
                  name={prayer.arabicName}
                  time={prayer.timeLabel}
                  isNext={prayer.arabicName === nextPrayer?.arabicName}
                  loggedStatus={todayLogs[prayer.arabicName] ?? null}
                  onLog={(status: PrayerStatus) => logPrayer(prayer.arabicName, status)}
                />
              ))}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
