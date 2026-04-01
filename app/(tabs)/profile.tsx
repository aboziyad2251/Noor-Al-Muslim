import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { User, Settings, Bell, CircleDollarSign, ChevronLeft, ShieldCheck, LogOut, LogIn, Crown, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { usePrayerLog } from '../../hooks/usePrayerLog';
import { useRevenueCat } from '../../hooks/useRevenueCat';

function toArabicNum(n: number): string {
  return n.toLocaleString('ar-SA');
}

function getLevel(total: number): string {
  if (total >= 500) return 'من المحسنين';
  if (total >= 200) return 'مواظب على الطاعة';
  if (total >= 50)  return 'باحث عن الأجر';
  return 'في بداية الطريق';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, session, signOut } = useAuthStore();
  const { totalLogged, streak } = usePrayerLog();
  const { isPremium } = useRevenueCat();

  const displayName = user?.user_metadata?.full_name ?? (session ? 'مسلم' : 'ضيف');
  const isGuest = !session;

  const handleSignOut = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'خروج', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View className="px-6 pt-16 pb-6 bg-[#1E293B]/50 border-b border-white/5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-2xl font-tajawal font-bold">حسابي</Text>
            <TouchableOpacity className="p-2">
              <Settings color="#94A3B8" size={24} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center mt-4 gap-4">
            <View className="w-16 h-16 bg-emerald-500/20 rounded-full items-center justify-center border border-emerald-500/30">
              <User color="#10B981" size={32} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-tajawal font-bold text-xl">{displayName}</Text>
              {isGuest ? (
                <TouchableOpacity
                  onPress={() => router.push('/auth')}
                  className="mt-1 flex-row items-center gap-1"
                >
                  <LogIn color="#10B981" size={14} />
                  <Text className="text-emerald-400 font-tajawal text-sm">سجّل دخولك لحفظ تقدّمك</Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-emerald-400 font-tajawal text-sm mt-1">
                  المستوى: {getLevel(totalLogged)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 py-6 border-b border-white/5">
          <Text className="text-white font-tajawal font-bold text-lg mb-4">إحصائياتي</Text>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl items-center">
              <Text className="text-slate-400 font-tajawal text-xs mb-1 text-center">الصلوات المسجّلة</Text>
              <Text className="text-white font-tajawal font-bold text-2xl mb-1">
                {toArabicNum(totalLogged)}
              </Text>
              <Text className="text-emerald-400 font-tajawal text-[10px] text-center">
                {totalLogged > 0 ? 'بارك الله فيك' : 'ابدأ التسجيل'}
              </Text>
            </View>
            <View className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl items-center">
              <Text className="text-slate-400 font-tajawal text-xs mb-1 text-center">أيام متتالية</Text>
              <Text className="text-white font-tajawal font-bold text-2xl mb-1">
                {toArabicNum(streak)}
              </Text>
              <Text className="text-emerald-400 font-tajawal text-[10px] text-center">
                {streak >= 7 ? 'ما شاء الله!' : streak > 0 ? 'واصل' : 'ابدأ اليوم'}
              </Text>
            </View>
            <View className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl items-center">
              <Text className="text-slate-400 font-tajawal text-xs mb-1 text-center">المستوى</Text>
              <Text className="text-white font-tajawal font-bold text-lg mb-1 text-center leading-tight">
                {getLevel(totalLogged)}
              </Text>
              <Text className="text-emerald-400 font-tajawal text-[10px] text-center">
                {totalLogged < 50 ? `${50 - totalLogged} للمستوى التالي` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View className="px-6 py-4 gap-3">

          <TouchableOpacity
            onPress={() => router.push('/zakat')}
            className="bg-white/5 border border-white/10 p-4 rounded-2xl flex-row items-center justify-between active:bg-white/10"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center border border-amber-500/20">
                <CircleDollarSign color="#F59E0B" size={20} />
              </View>
              <Text className="text-white font-tajawal text-base">حاسبة الزكاة</Text>
            </View>
            <ChevronLeft color="#64748B" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/settings/location')}
            className="bg-white/5 border border-white/10 p-4 rounded-2xl flex-row items-center justify-between active:bg-white/10"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-emerald-500/20 rounded-xl items-center justify-center border border-emerald-500/20">
                <MapPin color="#10B981" size={20} />
              </View>
              <Text className="text-white font-tajawal text-base">الموقع ومواقيت الصلاة</Text>
            </View>
            <ChevronLeft color="#64748B" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/settings/notifications')}
            className="bg-white/5 border border-white/10 p-4 rounded-2xl flex-row items-center justify-between active:bg-white/10"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center border border-white/5">
                <Bell color="#94A3B8" size={20} />
              </View>
              <Text className="text-white font-tajawal text-base">إعدادات التنبيهات</Text>
            </View>
            <ChevronLeft color="#64748B" size={20} />
          </TouchableOpacity>

          <TouchableOpacity className="bg-white/5 border border-white/10 p-4 rounded-2xl flex-row items-center justify-between active:bg-white/10">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center border border-white/5">
                <ShieldCheck color="#94A3B8" size={20} />
              </View>
              <Text className="text-white font-tajawal text-base">الخصوصية والأمان</Text>
            </View>
            <ChevronLeft color="#64748B" size={20} />
          </TouchableOpacity>

          {/* Sign out / sign in */}
          {isGuest ? (
            <TouchableOpacity
              onPress={() => router.push('/auth')}
              className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex-row items-center justify-between active:bg-emerald-500/20"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-emerald-500/20 rounded-xl items-center justify-center">
                  <LogIn color="#10B981" size={20} />
                </View>
                <Text className="text-emerald-400 font-tajawal text-base font-bold">تسجيل الدخول</Text>
              </View>
              <ChevronLeft color="#10B981" size={20} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSignOut}
              className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex-row items-center gap-3 active:bg-red-500/20"
            >
              <View className="w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center">
                <LogOut color="#EF4444" size={20} />
              </View>
              <Text className="text-red-400 font-tajawal text-base">تسجيل الخروج</Text>
            </TouchableOpacity>
          )}

          {/* Premium banner */}
          {isPremium ? (
            <View className="mt-2 p-5 rounded-3xl border border-amber-500/30 flex-row items-center gap-4" style={{ backgroundColor: '#451A03' }}>
              <View className="w-12 h-12 bg-amber-500/20 rounded-full items-center justify-center border border-amber-500/30 shrink-0">
                <Crown color="#F59E0B" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-amber-300 font-tajawal font-bold text-base">نور بريميوم مفعّل ✓</Text>
                <Text className="text-white/60 font-tajawal text-xs mt-0.5">جميع الميزات متاحة بلا حدود</Text>
              </View>
            </View>
          ) : (
            <View className="mt-2 p-6 rounded-3xl border border-emerald-500/30 items-center" style={{ backgroundColor: '#064E3B' }}>
              <Text className="text-emerald-300 font-tajawal font-bold text-lg mb-2">نور بريميوم</Text>
              <Text className="text-white/80 font-tajawal text-center text-xs mb-4 leading-6">
                ادعم التطبيق واحصل على ذكاء اصطناعي لا محدود وميزات حصرية — بدون إعلانات نهائياً.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/premium')}
                className="bg-emerald-500 px-8 py-3 rounded-full flex-row items-center gap-2"
              >
                <Crown color="white" size={16} />
                <Text className="text-white font-tajawal font-bold text-base">الاشتراك الآن</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}
