import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Star, RefreshCw, Lock, TrendingUp, BookOpen } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useWeeklyReport } from '../hooks/useWeeklyReport';
import { useAuthStore } from '../store/useAuthStore';

function StatBadge({ label, value, total, color }: { label: string; value: number; total?: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : null;
  return (
    <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 items-center">
      <Text className="font-tajawal font-bold text-2xl" style={{ color }}>{value}</Text>
      {total && <Text className="text-slate-500 font-tajawal text-xs">{pct}٪ من {total}</Text>}
      <Text className="text-slate-400 font-tajawal text-xs text-center mt-1">{label}</Text>
    </View>
  );
}

export default function WeeklyReportScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { report, isLoading, error, isFriday, generate } = useWeeklyReport();

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      {/* Header */}
      <BlurView intensity={20} tint="dark" className="pt-16 pb-4 px-5 flex-row items-center justify-between border-b border-white/5">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
        >
          <ChevronRight color="#94A3B8" size={20} />
        </TouchableOpacity>
        <View className="items-center flex-1">
          <Text className="text-white font-amiri text-2xl">التقرير الروحاني الأسبوعي</Text>
          <Text className="text-slate-400 font-tajawal text-xs mt-0.5">
            {isFriday ? '🌟 يوم الجمعة المبارك' : 'ملخص عبادتك الأسبوعية'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={generate}
          disabled={isLoading}
          className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
        >
          <RefreshCw color="#94A3B8" size={18} />
        </TouchableOpacity>
      </BlurView>

      {/* Not signed in */}
      {!session && (
        <View className="flex-1 items-center justify-center px-8 gap-5">
          <Lock color="#64748B" size={48} strokeWidth={1.5} />
          <Text className="text-white font-tajawal font-bold text-xl text-center">
            سجّل دخولك لعرض تقريرك
          </Text>
          <Text className="text-slate-400 font-tajawal text-sm text-center leading-6">
            التقرير الأسبوعي يحتاج إلى حسابك لتحليل إحصائيات عبادتك من الخادم.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/auth')}
            className="bg-emerald-500 px-8 py-3 rounded-full"
          >
            <Text className="text-white font-tajawal font-bold text-base">تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {session && isLoading && (
        <View className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator color="#10B981" size="large" />
          <Text className="text-slate-400 font-tajawal text-sm">نور يُعدّ تقريرك الأسبوعي...</Text>
          <Text className="text-slate-600 font-tajawal text-xs">قد يستغرق بضع ثوانٍ</Text>
        </View>
      )}

      {/* Error */}
      {session && !isLoading && error && (
        <View className="flex-1 items-center justify-center px-8 gap-5">
          <Text className="text-slate-400 font-tajawal text-center leading-7">{error}</Text>
          <TouchableOpacity
            onPress={generate}
            className="flex-row items-center gap-2 bg-emerald-500/20 px-6 py-3 rounded-2xl border border-emerald-500/30"
          >
            <RefreshCw color="#34D399" size={18} />
            <Text className="text-emerald-400 font-tajawal font-bold">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Report */}
      {session && !isLoading && report && (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Week badge */}
          <View className="flex-row justify-center mb-6">
            <View className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 rounded-full flex-row items-center gap-2">
              <Star color="#10B981" size={14} />
              <Text className="text-emerald-400 font-tajawal text-sm font-bold">
                {report.stats.weekKey} • {report.stats.startDate} إلى {report.stats.endDate}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View className="flex-row gap-3 mb-6">
            <StatBadge
              label="صلوات مسجّلة"
              value={report.stats.totalPrayers}
              total={report.stats.possiblePrayers}
              color="#10B981"
            />
            <StatBadge
              label="بالجماعة"
              value={report.stats.jamaahCount}
              color="#6366F1"
            />
            <StatBadge
              label="أيام صيام"
              value={report.stats.fastingDays}
              color="#F59E0B"
            />
          </View>

          {/* Prayer progress bar */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-400 font-tajawal text-xs">
                {report.stats.totalPrayers} من {report.stats.possiblePrayers} صلاة
              </Text>
              <View className="flex-row items-center gap-1">
                <TrendingUp color="#10B981" size={14} />
                <Text className="text-white font-tajawal text-xs font-bold">مواظبة الصلاة</Text>
              </View>
            </View>
            <View className="h-3 bg-white/10 rounded-full overflow-hidden">
              <View
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, Math.round((report.stats.totalPrayers / report.stats.possiblePrayers) * 100))}%` }}
              />
            </View>
            {report.stats.missedCount > 0 && (
              <Text className="text-slate-500 font-tajawal text-xs mt-2 text-left">
                {report.stats.missedCount} صلاة فائتة هذا الأسبوع
              </Text>
            )}
          </View>

          {/* AI Report */}
          <View className="rounded-3xl overflow-hidden border border-emerald-500/20 mb-4">
            <BlurView intensity={15} tint="dark" className="p-6 bg-emerald-900/10">
              <View className="flex-row items-center gap-2 mb-5">
                <BookOpen color="#10B981" size={18} />
                <Text className="text-emerald-400 font-tajawal font-bold text-base">تقرير نور الأسبوعي</Text>
              </View>
              <Text
                className="text-white font-tajawal text-base leading-8"
                style={{ writingDirection: 'rtl' }}
              >
                {report.report}
              </Text>
            </BlurView>
          </View>

          {/* Cached note */}
          {report.cached && (
            <Text className="text-slate-600 font-tajawal text-xs text-center mt-2">
              تقرير هذا الأسبوع • اضغط ↺ لتحديث
            </Text>
          )}

        </ScrollView>
      )}
    </View>
  );
}
