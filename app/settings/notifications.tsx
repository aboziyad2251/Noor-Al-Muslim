import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Bell, BellOff, Moon, Sun, Book, Volume2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermission, scheduleDailyReminder } from '../../lib/notifications';
import { playAthan, stopAthan, isAthanPlaying } from '../../lib/athan';

const SETTINGS_KEY = 'noor_notif_settings';

interface NotifSettings {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  morningAdhkar: boolean;
  eveningAdhkar: boolean;
  dailyQuran: boolean;
  athanEnabled: boolean;
}

const DEFAULT: NotifSettings = {
  fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true,
  morningAdhkar: true, eveningAdhkar: true, dailyQuran: false,
  athanEnabled: true,
};

const PRAYER_ROWS: { key: keyof NotifSettings; label: string; sub: string }[] = [
  { key: 'fajr',    label: 'الفجر',   sub: 'تنبيه عند دخول وقت الفجر' },
  { key: 'dhuhr',   label: 'الظهر',   sub: 'تنبيه عند دخول وقت الظهر' },
  { key: 'asr',     label: 'العصر',   sub: 'تنبيه عند دخول وقت العصر' },
  { key: 'maghrib', label: 'المغرب',  sub: 'تنبيه عند دخول وقت المغرب' },
  { key: 'isha',    label: 'العشاء',  sub: 'تنبيه عند دخول وقت العشاء' },
];

const REMINDER_ROWS: { key: keyof NotifSettings; label: string; sub: string; icon: React.ComponentType<{color: string; size: number}>; color: string }[] = [
  { key: 'morningAdhkar', label: 'أذكار الصباح', sub: 'تذكير يومي الساعة ٧:٠٠ ص', icon: Sun,  color: '#F59E0B' },
  { key: 'eveningAdhkar', label: 'أذكار المساء', sub: 'تذكير يومي الساعة ٦:٠٠ م', icon: Moon, color: '#818CF8' },
  { key: 'dailyQuran',    label: 'ورد القرآن اليومي', sub: 'تذكير لقراءة القرآن الساعة ٩:٠٠ ص', icon: Book, color: '#34D399' },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [athanPreviewPlaying, setAthanPreviewPlaying] = useState(false);

  useEffect(() => {
    async function load() {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings(JSON.parse(raw));

      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
    }
    load();
  }, []);

  const toggle = async (key: keyof NotifSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

    // Schedule or cancel daily reminders
    if (key === 'morningAdhkar' && updated.morningAdhkar) {
      await scheduleDailyReminder(7, 0, '🌅 أذكار الصباح', 'حان وقت أذكار الصباح — حصّن يومك بذكر الله');
    }
    if (key === 'eveningAdhkar' && updated.eveningAdhkar) {
      await scheduleDailyReminder(18, 0, '🌙 أذكار المساء', 'حان وقت أذكار المساء — أختم يومك بذكر الله');
    }
    if (key === 'dailyQuran' && updated.dailyQuran) {
      await scheduleDailyReminder(9, 0, '📖 ورد القرآن', 'لا تنسَ ورد القرآن اليومي');
    }
    // Prayer time notifications are re-scheduled from usePrayerTimes on next app open
  };

  const toggleAthanPreview = async () => {
    if (athanPreviewPlaying) {
      await stopAthan();
      setAthanPreviewPlaying(false);
    } else {
      setAthanPreviewPlaying(true);
      await playAthan('fajr'); // preview using fajr athan
      setAthanPreviewPlaying(false);
    }
  };

  const requestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
  };

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Header */}
        <View className="px-4 pt-16 pb-4 flex-row items-center gap-3 border-b border-white/5">
          <TouchableOpacity onPress={() => router.back()} className="p-2 border border-white/10 rounded-full">
            <ChevronRight color="white" size={22} />
          </TouchableOpacity>
          <View>
            <Text className="text-white font-amiri text-2xl">إعدادات التنبيهات</Text>
            <Text className="text-slate-400 font-tajawal text-xs">تحكّم في تنبيهات مواقيت الصلاة والأذكار</Text>
          </View>
        </View>

        <View className="px-6 pt-6 gap-6">

          {/* Permission banner */}
          {!permissionGranted && (
            <TouchableOpacity
              onPress={requestPermission}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex-row items-center gap-3"
            >
              <BellOff color="#EF4444" size={20} />
              <View className="flex-1">
                <Text className="text-red-400 font-tajawal font-bold text-sm">التنبيهات معطّلة</Text>
                <Text className="text-red-300/70 font-tajawal text-xs mt-0.5">
                  اضغط هنا للسماح للتطبيق بإرسال التنبيهات
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Prayer time toggles */}
          <View>
            <View className="flex-row items-center gap-2 mb-4">
              <Bell color="#10B981" size={18} />
              <Text className="text-white font-tajawal font-bold text-lg">تنبيهات مواقيت الصلاة</Text>
            </View>
            <View className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
              {PRAYER_ROWS.map(({ key, label, sub }, i) => (
                <View
                  key={key}
                  className={`flex-row items-center justify-between px-4 py-4 ${i < PRAYER_ROWS.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <Switch
                    value={settings[key]}
                    onValueChange={() => toggle(key)}
                    trackColor={{ false: '#334155', true: '#10B981' }}
                    thumbColor="white"
                    ios_backgroundColor="#334155"
                  />
                  <View className="flex-1 mr-3 items-end">
                    <Text className="text-white font-tajawal font-bold text-base">{label}</Text>
                    <Text className="text-slate-400 font-tajawal text-xs mt-0.5">{sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Daily reminders */}
          <View>
            <View className="flex-row items-center gap-2 mb-4">
              <Bell color="#818CF8" size={18} />
              <Text className="text-white font-tajawal font-bold text-lg">التذكيرات اليومية</Text>
            </View>
            <View className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
              {REMINDER_ROWS.map(({ key, label, sub, icon: Icon, color }, i) => (
                <View
                  key={key}
                  className={`flex-row items-center justify-between px-4 py-4 ${i < REMINDER_ROWS.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <Switch
                    value={settings[key]}
                    onValueChange={() => toggle(key)}
                    trackColor={{ false: '#334155', true: color }}
                    thumbColor="white"
                    ios_backgroundColor="#334155"
                  />
                  <View className="flex-1 flex-row items-center justify-end gap-3 mr-3">
                    <View className="items-end">
                      <Text className="text-white font-tajawal font-bold text-base">{label}</Text>
                      <Text className="text-slate-400 font-tajawal text-xs mt-0.5">{sub}</Text>
                    </View>
                    <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}22` }}>
                      <Icon color={color} size={18} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Athan settings */}
          <View>
            <View className="flex-row items-center gap-2 mb-4">
              <Volume2 color="#10B981" size={18} />
              <Text className="text-white font-tajawal font-bold text-lg">الأذان</Text>
            </View>
            <View className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
                <Switch
                  value={settings.athanEnabled}
                  onValueChange={() => toggle('athanEnabled')}
                  trackColor={{ false: '#334155', true: '#10B981' }}
                  thumbColor="white"
                  ios_backgroundColor="#334155"
                />
                <View className="flex-1 mr-3 items-end">
                  <Text className="text-white font-tajawal font-bold text-base">تشغيل الأذان تلقائياً</Text>
                  <Text className="text-slate-400 font-tajawal text-xs mt-0.5">
                    يُشغَّل أذان الفجر عند وقت الفجر، وأذان الصلاة لباقي الأوقات
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={toggleAthanPreview}
                className="flex-row items-center justify-between px-4 py-4"
              >
                <View className="flex-row items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
                  <Volume2 color="#10B981" size={14} />
                  <Text className="text-emerald-400 font-tajawal text-xs font-bold">
                    {athanPreviewPlaying ? 'إيقاف المعاينة' : 'معاينة الأذان'}
                  </Text>
                </View>
                <Text className="text-slate-400 font-tajawal text-sm">استمع للأذان</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-slate-500 font-tajawal text-xs text-center leading-5">
            تنبيهات مواقيت الصلاة تُحدَّث تلقائياً بناءً على موقعك عند فتح التطبيق
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
