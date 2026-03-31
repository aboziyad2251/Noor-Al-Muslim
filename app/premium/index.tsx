import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ChevronRight, Crown, Zap, Infinity, MessageCircle, BookOpen, Bell } from 'lucide-react-native';
import { useRevenueCat, RC_PRODUCTS } from '../../hooks/useRevenueCat';

const PLANS = [
  {
    id: RC_PRODUCTS.monthly,
    label: 'شهري',
    price: '١٩٫٩٩ ر.س',
    period: '/شهر',
    highlight: false,
  },
  {
    id: RC_PRODUCTS.annual,
    label: 'سنوي',
    price: '١٤٩ ر.س',
    period: '/سنة',
    badge: 'الأفضل قيمة',
    highlight: true,
  },
  {
    id: RC_PRODUCTS.family,
    label: 'عائلي',
    price: '٢٩٩ ر.س',
    period: '/سنة',
    badge: 'حتى ٦ أفراد',
    highlight: false,
  },
];

const FEATURES = [
  { icon: Infinity, label: 'ذكاء اصطناعي لا محدود', sub: 'بدون حد يومي للمحادثات والتفسير' },
  { icon: MessageCircle, label: 'مساعد نور الشخصي', sub: 'أسئلة دينية وفقهية غير محدودة' },
  { icon: BookOpen, label: 'تفسير شامل لكل الآيات', sub: 'تفسير فوري لأي آية بنقرة واحدة' },
  { icon: Zap, label: 'ردود أسرع وأدق', sub: 'أولوية الوصول لأفضل نماذج الذكاء' },
  { icon: Bell, label: 'تنبيهات أذكار مخصصة', sub: 'جداول تذكير شخصية طوال اليوم' },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { isPremium, isLoading, purchase, restore } = useRevenueCat();
  const [selectedPlan, setSelectedPlan] = useState(RC_PRODUCTS.annual);
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    const result = await purchase(selectedPlan);
    setPurchasing(false);
    if (result.success) {
      Alert.alert(
        'مبارك!',
        'تم تفعيل اشتراكك في نور بريميوم. استمتع بجميع الميزات الآن.',
        [{ text: 'شكراً', onPress: () => router.back() }]
      );
    } else if (result.error) {
      Alert.alert('حدث خطأ', result.error);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const result = await restore();
    setPurchasing(false);
    if (result.success) {
      Alert.alert('تم الاستعادة', 'تم استعادة اشتراكك بنجاح.');
    } else if (result.error) {
      Alert.alert('لم يتم العثور على اشتراك', result.error);
    }
  };

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>

      {/* Header */}
      <BlurView intensity={20} tint="dark" className="pt-16 pb-4 px-4 flex-row items-center border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()} className="p-2 border border-white/10 rounded-full ml-3">
          <ChevronRight color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white font-tajawal font-bold text-lg flex-1 text-center ml-10">نور بريميوم</Text>
      </BlurView>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero */}
        <View className="items-center px-6 pt-10 pb-8">
          <View className="w-20 h-20 bg-amber-500/20 rounded-full items-center justify-center border border-amber-500/30 mb-4">
            <Crown color="#F59E0B" size={40} />
          </View>
          <Text className="text-white font-amiri text-3xl mb-2 text-center">
            {isPremium ? 'أنت مشترك بالفعل ✓' : 'ارتقِ بتجربتك'}
          </Text>
          <Text className="text-slate-400 font-tajawal text-center text-sm leading-6">
            {isPremium
              ? 'شكراً لدعمك! جميع الميزات متاحة لك.'
              : 'احصل على تجربة إسلامية كاملة مع ذكاء اصطناعي لا محدود وميزات حصرية.'}
          </Text>
        </View>

        {/* Features */}
        <View className="px-6 mb-8">
          <Text className="text-white font-tajawal font-bold text-base mb-4 text-right">ما الذي تحصل عليه:</Text>
          <View className="gap-3">
            {FEATURES.map((f, i) => (
              <View key={i} className="flex-row items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
                <View className="w-10 h-10 bg-emerald-500/20 rounded-xl items-center justify-center border border-emerald-500/20 shrink-0">
                  <f.icon color="#10B981" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-tajawal font-bold text-sm">{f.label}</Text>
                  <Text className="text-slate-400 font-tajawal text-xs mt-0.5">{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Plans — only show if not already premium */}
        {!isPremium && (
          <View className="px-6 mb-6">
            <Text className="text-white font-tajawal font-bold text-base mb-4 text-right">اختر خطتك:</Text>
            <View className="gap-3">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                      isSelected
                        ? plan.highlight
                          ? 'border-emerald-500 bg-emerald-900/30'
                          : 'border-emerald-500/60 bg-emerald-900/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSelected ? 'border-emerald-500' : 'border-slate-600'}`}>
                        {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                      </View>
                      <View>
                        <Text className={`font-tajawal font-bold text-base ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {plan.label}
                        </Text>
                        {plan.badge && (
                          <Text className="text-emerald-400 font-tajawal text-xs">{plan.badge}</Text>
                        )}
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-tajawal font-bold text-lg ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {plan.price}
                      </Text>
                      <Text className="text-slate-500 font-tajawal text-xs">{plan.period}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* CTA */}
        {!isPremium && (
          <View className="px-6 gap-3">
            <TouchableOpacity
              onPress={handlePurchase}
              disabled={purchasing || isLoading}
              className="bg-emerald-500 rounded-2xl py-4 items-center justify-center flex-row gap-2 active:bg-emerald-600"
              style={{ opacity: purchasing || isLoading ? 0.6 : 1 }}
            >
              {purchasing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Crown color="white" size={18} />
                  <Text className="text-white font-tajawal font-bold text-lg">اشترك الآن</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRestore}
              disabled={purchasing}
              className="py-3 items-center"
            >
              <Text className="text-slate-400 font-tajawal text-sm">استعادة الاشتراك السابق</Text>
            </TouchableOpacity>

            <Text className="text-slate-600 font-tajawal text-xs text-center leading-5 px-4">
              يتجدد الاشتراك تلقائياً. يمكنك الإلغاء في أي وقت من إعدادات متجر التطبيقات.
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
