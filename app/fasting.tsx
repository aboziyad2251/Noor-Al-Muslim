import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ChevronRight, Moon, Sun, Flame, Calendar, Bell, Smartphone } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFasting, FastType, FAST_TYPE_LABELS } from '../hooks/useFasting';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import {
  scheduleSuhoorReminder,
  scheduleIftarReminder,
  cancelFastingReminders,
} from '../lib/notifications';

const FASTING_NOTIF_KEY = 'noor_fasting_notif';

interface FastingNotifSettings {
  suhoor: boolean;
  iftar: boolean;
  suhoorMinsBefore: number;
}

const DEFAULT_NOTIF: FastingNotifSettings = {
  suhoor: true,
  iftar: true,
  suhoorMinsBefore: 30,
};

const FAST_TYPES: FastType[] = [
  'ramadan',
  'sunnah_mon_thu',
  'shawwal',
  'ayyam_beed',
  'voluntary',
];

const FAST_TYPE_COLORS: Record<FastType, string> = {
  ramadan:        '#10B981',
  sunnah_mon_thu: '#6366F1',
  shawwal:        '#F59E0B',
  ayyam_beed:     '#0EA5E9',
  voluntary:      '#94A3B8',
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // Shift so week starts Saturday (Islamic calendar convention)
  return (new Date(year, month, 1).getDay() + 1) % 7;
}

export default function FastingScreen() {
  const router = useRouter();
  const { todayFasted, todayType, streak, totalThisMonth, totalAllTime, monthLog, logFast, unlogFast } = useFasting();
  const { prayers } = usePrayerTimes();

  const [selectedType, setSelectedType] = useState<FastType>('voluntary');
  const [notifSettings, setNotifSettings] = useState<FastingNotifSettings>(DEFAULT_NOTIF);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = now.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

  useEffect(() => {
    AsyncStorage.getItem(FASTING_NOTIF_KEY).then((raw) => {
      if (raw) setNotifSettings(JSON.parse(raw));
    });
  }, []);

  const saveNotifSettings = async (updated: FastingNotifSettings) => {
    setNotifSettings(updated);
    await AsyncStorage.setItem(FASTING_NOTIF_KEY, JSON.stringify(updated));

    const fajr = prayers.find((p) => p.arabicName === 'الفجر');
    const maghrib = prayers.find((p) => p.arabicName === 'المغرب');

    if (!updated.suhoor && !updated.iftar) {
      await cancelFastingReminders();
      return;
    }
    if (updated.suhoor && fajr) {
      await scheduleSuhoorReminder(fajr.time, updated.suhoorMinsBefore);
    }
    if (updated.iftar && maghrib) {
      await scheduleIftarReminder(maghrib.time);
    }
  };

  const handleToggleFast = async () => {
    if (todayFasted) {
      Alert.alert(
        'إلغاء تسجيل الصيام',
        'هل تريد إلغاء تسجيل صيام اليوم؟',
        [
          { text: 'لا', style: 'cancel' },
          { text: 'نعم', onPress: unlogFast },
        ]
      );
    } else {
      await logFast(selectedType);
    }
  };

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      {/* Header */}
      <View className="flex-row items-center px-6 pt-16 pb-6 bg-[#1E293B]/50 border-b border-white/5">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white/10 rounded-full items-center justify-center ml-4"
        >
          <ChevronRight color="#94A3B8" size={20} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-3">
          <Moon color="#10B981" size={22} />
          <Text className="text-white text-xl font-tajawal font-bold">تتبع الصيام</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-6">
          {[
            { label: 'سلسلة الأيام', value: streak, icon: <Flame color="#F59E0B" size={16} />, color: '#F59E0B' },
            { label: 'هذا الشهر', value: totalThisMonth, icon: <Calendar color="#10B981" size={16} />, color: '#10B981' },
            { label: 'الإجمالي', value: totalAllTime, icon: <Moon color="#6366F1" size={16} />, color: '#6366F1' },
          ].map((s) => (
            <View key={s.label} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl items-center">
              <View className="mb-1">{s.icon}</View>
              <Text className="text-white font-tajawal font-bold text-2xl">{s.value}</Text>
              <Text className="text-slate-400 font-tajawal text-xs text-center mt-1">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Today Card */}
        <View className={`rounded-3xl border p-6 mb-6 ${todayFasted ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
          <Text className="text-white font-tajawal font-bold text-lg mb-4 text-center">
            {todayFasted ? '✓ أنت صائم اليوم' : 'هل أنت صائم اليوم؟'}
          </Text>

          {/* Fast type selector — hidden if already fasted */}
          {!todayFasted && (
            <View className="flex-row flex-wrap gap-2 justify-center mb-5">
              {FAST_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className="px-4 py-2 rounded-full border"
                  style={{
                    backgroundColor: selectedType === type ? `${FAST_TYPE_COLORS[type]}33` : 'transparent',
                    borderColor: selectedType === type ? FAST_TYPE_COLORS[type] : '#334155',
                  }}
                >
                  <Text
                    className="font-tajawal text-sm"
                    style={{ color: selectedType === type ? FAST_TYPE_COLORS[type] : '#94A3B8' }}
                  >
                    {FAST_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {todayFasted && todayType && (
            <View className="items-center mb-4">
              <View
                className="px-4 py-1.5 rounded-full border"
                style={{ backgroundColor: `${FAST_TYPE_COLORS[todayType]}22`, borderColor: FAST_TYPE_COLORS[todayType] }}
              >
                <Text className="font-tajawal text-sm font-bold" style={{ color: FAST_TYPE_COLORS[todayType] }}>
                  {FAST_TYPE_LABELS[todayType]}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleToggleFast}
            className={`py-4 rounded-2xl items-center ${todayFasted ? 'bg-white/10' : 'bg-emerald-500'}`}
          >
            <Text className={`font-tajawal font-bold text-base ${todayFasted ? 'text-slate-300' : 'text-white'}`}>
              {todayFasted ? 'إلغاء تسجيل الصيام' : 'تسجيل الصيام'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Calendar */}
        <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-6">
          <View className="flex-row items-center gap-2 mb-4">
            <Calendar color="#94A3B8" size={18} />
            <Text className="text-white font-tajawal font-bold text-base">{monthName}</Text>
          </View>

          {/* Day headers — Sat to Fri */}
          <View className="flex-row mb-2">
            {['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((d) => (
              <View key={d} className="flex-1 items-center">
                <Text className="text-slate-500 font-tajawal text-xs">{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View className="flex-row flex-wrap">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`empty-${i}`} style={{ width: `${100 / 7}%` }} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const fastType = monthLog[dateKey] as FastType | undefined;
              const isToday = day === todayDate;
              const isFasted = !!fastType;

              return (
                <View
                  key={day}
                  style={{ width: `${100 / 7}%` }}
                  className="aspect-square items-center justify-center p-0.5"
                >
                  <View
                    className="w-full h-full rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isFasted
                        ? `${FAST_TYPE_COLORS[fastType!]}33`
                        : isToday
                        ? '#1E293B'
                        : 'transparent',
                      borderWidth: isToday ? 1.5 : 0,
                      borderColor: isToday ? '#10B981' : 'transparent',
                    }}
                  >
                    <Text
                      className="font-tajawal text-xs"
                      style={{ color: isFasted ? FAST_TYPE_COLORS[fastType!] : isToday ? '#10B981' : '#64748B' }}
                    >
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View className="flex-row flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/5">
            {FAST_TYPES.map((type) => (
              <View key={type} className="flex-row items-center gap-1.5">
                <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FAST_TYPE_COLORS[type] }} />
                <Text className="text-slate-400 font-tajawal text-xs">{FAST_TYPE_LABELS[type]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Suhoor / Iftar Reminders — Android only */}
        {Platform.OS === 'android' ? (
          <View className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <View className="flex-row items-center gap-2 mb-4">
              <Bell color="#94A3B8" size={18} />
              <Text className="text-white font-tajawal font-bold text-base">تنبيهات السحور والإفطار</Text>
            </View>

            <View className="gap-4">
              {/* Suhoor toggle */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Moon color="#6366F1" size={18} />
                  <View>
                    <Text className="text-white font-tajawal text-sm">تذكير السحور</Text>
                    <Text className="text-slate-400 font-tajawal text-xs">
                      قبل الفجر بـ {notifSettings.suhoorMinsBefore} دقيقة
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notifSettings.suhoor}
                  onValueChange={(v) => saveNotifSettings({ ...notifSettings, suhoor: v })}
                  trackColor={{ false: '#334155', true: '#6366F1' }}
                  thumbColor="white"
                />
              </View>

              {/* Suhoor offset buttons */}
              {notifSettings.suhoor && (
                <View className="flex-row gap-2 mr-9">
                  {[15, 30, 45, 60].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      onPress={() => saveNotifSettings({ ...notifSettings, suhoorMinsBefore: mins })}
                      className="px-3 py-1.5 rounded-full border"
                      style={{
                        backgroundColor: notifSettings.suhoorMinsBefore === mins ? '#6366F133' : 'transparent',
                        borderColor: notifSettings.suhoorMinsBefore === mins ? '#6366F1' : '#334155',
                      }}
                    >
                      <Text
                        className="font-tajawal text-xs"
                        style={{ color: notifSettings.suhoorMinsBefore === mins ? '#818CF8' : '#64748B' }}
                      >
                        {mins}د
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View className="h-px bg-white/5" />

              {/* Iftar toggle */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Sun color="#F59E0B" size={18} />
                  <View>
                    <Text className="text-white font-tajawal text-sm">تذكير الإفطار</Text>
                    <Text className="text-slate-400 font-tajawal text-xs">عند أذان المغرب</Text>
                  </View>
                </View>
                <Switch
                  value={notifSettings.iftar}
                  onValueChange={(v) => saveNotifSettings({ ...notifSettings, iftar: v })}
                  trackColor={{ false: '#334155', true: '#F59E0B' }}
                  thumbColor="white"
                />
              </View>
            </View>
          </View>
        ) : (
          <View className="bg-white/5 border border-white/10 rounded-3xl p-5 flex-row items-center gap-4">
            <Smartphone color="#64748B" size={20} />
            <View className="flex-1">
              <Text className="text-white font-tajawal font-bold text-sm mb-1">تنبيهات السحور والإفطار</Text>
              <Text className="text-slate-400 font-tajawal text-xs leading-5">
                تتوفر تنبيهات الصيام على تطبيق الأندرويد فقط — حمّل التطبيق للحصول على تذكير السحور والإفطار.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
