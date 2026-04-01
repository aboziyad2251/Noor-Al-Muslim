import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { ChevronLeft, LogIn } from 'lucide-react-native';
import { requestNotificationPermission } from '../../lib/notifications';

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useAuthStore(state => state.completeOnboarding);

  const handleStart = async () => {
    await requestNotificationPermission();
    await completeOnboarding();
    router.replace('/(tabs)/');
  };

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      <ImageBackground 
        source={require('../../assets/splash-icon.png')} // Using existing assets placeholder
        className="flex-1 justify-end p-6"
        imageStyle={{ opacity: 0.1, resizeMode: 'cover' }}
      >
        <View className="mb-12">
          {/* Main Titles */}
          <Text className="text-emerald-400 font-tajawal text-lg mb-2">مرحباً بك في</Text>
          <Text className="text-white text-5xl font-amiri mb-4 leading-tight">نور المسلم</Text>
          
          <Text className="text-slate-400 font-tajawal text-base leading-7">
            رفيقك الإسلامي الذكي. تصفح القرآن الكريم، ابحث عن الأذكار والأدعية، وتواصل مع رفيقك الذكي لفهم أعمق لدينك بدون إزعاج وسائل التواصل.
          </Text>
        </View>

        <View className="gap-4 pb-8">
          {/* Action Buttons */}
          <TouchableOpacity 
            onPress={handleStart}
            className="bg-emerald-500 rounded-2xl py-4 items-center flex-row justify-center overflow-hidden"
          >
            <Text className="text-white font-tajawal font-bold text-lg mx-2">ابدأ رحلتك كضيف</Text>
            <ChevronLeft color="white" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#1E293B] border border-white/10 rounded-2xl py-4 items-center flex-row justify-center"
            onPress={() => router.push('/auth')}
          >
            <Text className="text-white font-tajawal font-bold text-lg mx-2">تسجيل الدخول / إنشاء حساب</Text>
            <LogIn color="white" size={20} />
          </TouchableOpacity>
        </View>

        <Text className="text-center text-slate-500 font-tajawal text-xs mb-8">
          باستخدامك للتطبيق، أنت توافق على الشروط والأحكام و سياسة الخصوصية
        </Text>
      </ImageBackground>
    </View>
  );
}
