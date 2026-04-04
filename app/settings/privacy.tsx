import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, ShieldCheck, Trash2, Eye, Lock, ExternalLink } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrivacyScreen() {
  const router = useRouter();

  const handleClearData = () => {
    Alert.alert(
      'مسح البيانات المحلية',
      'سيتم حذف جميع البيانات المحفوظة على الجهاز (سجلات الصلاة، الإعدادات). هذا الإجراء لا يمكن التراجع عنه.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مسح',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('تم', 'تم مسح جميع البيانات المحلية.');
          },
        },
      ]
    );
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
          <ShieldCheck color="#10B981" size={22} />
          <Text className="text-white text-xl font-tajawal font-bold">الخصوصية والأمان</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>

        {/* What we collect */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Eye color="#94A3B8" size={18} />
            <Text className="text-white font-tajawal font-bold text-lg">البيانات التي نجمعها</Text>
          </View>
          <View className="bg-white/5 border border-white/10 rounded-2xl p-5 gap-4">
            {[
              { label: 'الموقع الجغرافي', detail: 'لحساب مواقيت الصلاة والقبلة فقط — لا يُخزَّن على خوادمنا.' },
              { label: 'سجلات الصلاة', detail: 'تُخزَّن على جهازك وتُزامَن بحسابك إن كنت مسجّلاً.' },
              { label: 'الحساب (اختياري)', detail: 'البريد الإلكتروني فقط — لا نطلب بيانات شخصية إضافية.' },
              { label: 'إحصائيات الاستخدام', detail: 'مجهولة الهوية تماماً، تُستخدم لتحسين التطبيق.' },
            ].map((item) => (
              <View key={item.label} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <Text className="text-white font-tajawal font-semibold text-sm mb-1">{item.label}</Text>
                <Text className="text-slate-400 font-tajawal text-xs leading-5">{item.detail}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Security */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Lock color="#94A3B8" size={18} />
            <Text className="text-white font-tajawal font-bold text-lg">الأمان</Text>
          </View>
          <View className="bg-white/5 border border-white/10 rounded-2xl p-5 gap-4">
            {[
              { label: 'تشفير البيانات', detail: 'جميع الاتصالات مشفّرة بـ HTTPS/TLS.' },
              { label: 'الذكاء الاصطناعي', detail: 'محادثاتك مع "نور" لا تُخزَّن ولا تُستخدم لتدريب النماذج.' },
              { label: 'مفاتيح API', detail: 'مفاتيح الواجهات لا تصل إلى تطبيقك — تمر عبر خوادم آمنة فقط.' },
            ].map((item) => (
              <View key={item.label} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <Text className="text-white font-tajawal font-semibold text-sm mb-1">{item.label}</Text>
                <Text className="text-slate-400 font-tajawal text-xs leading-5">{item.detail}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:privacy@zimura.digital')}
            className="bg-white/5 border border-white/10 p-4 rounded-2xl flex-row items-center justify-between active:bg-white/10"
          >
            <View className="flex-row items-center gap-3">
              <ExternalLink color="#94A3B8" size={18} />
              <Text className="text-white font-tajawal text-sm">طلب حذف حسابي وبياناتي</Text>
            </View>
            <ChevronRight color="#64748B" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearData}
            className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex-row items-center justify-between active:bg-red-500/20"
          >
            <View className="flex-row items-center gap-3">
              <Trash2 color="#EF4444" size={18} />
              <Text className="text-red-400 font-tajawal text-sm">مسح البيانات المحلية</Text>
            </View>
            <ChevronRight color="#EF4444" size={18} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
