import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { BookOpen, Users, Compass, BookA, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useHadith } from '../../hooks/useHadith';
import SCIENTISTS from '../../assets/data/scientists.json';

interface Scientist {
  id: string;
  name: string;
  title: string;
  fields: string[];
  color: string;
}

export default function DiscoverScreen() {
  const router = useRouter();
  const { hadith, isLoading } = useHadith();

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <Text className="text-white text-3xl font-amiri">اكتشف</Text>
          <Text className="text-slate-400 font-tajawal text-sm mt-1">تعمق في علوم الدين والتاريخ</Text>
        </View>

        {/* Hadith of the Day */}
        <View className="px-6 mb-8">
          <View className="rounded-3xl overflow-hidden border border-white/10">
            <BlurView intensity={20} tint="dark" className="p-6">
              <View className="flex-row items-center mb-4">
                <View className="bg-emerald-500/20 p-2 rounded-full ml-3">
                  <BookOpen color="#34D399" size={20} />
                </View>
                <Text className="text-white font-tajawal font-bold text-lg">حديث اليوم</Text>
              </View>
              {isLoading ? (
                <View className="py-4 items-center">
                  <ActivityIndicator color="#10B981" />
                </View>
              ) : (
                <>
                  <Text className="text-slate-200 font-amiri text-xl leading-loose mb-3" style={{ textAlign: 'right', writingDirection: 'rtl' }}>
                    "{hadith.text}"
                  </Text>
                  {hadith.narrator ? (
                    <Text className="text-slate-400 font-tajawal text-sm mb-1" style={{ textAlign: 'right' }}>عن {hadith.narrator}</Text>
                  ) : null}
                  <Text className="text-emerald-400 font-tajawal text-sm" style={{ textAlign: 'right' }}>{hadith.collection}</Text>
                </>
              )}
            </BlurView>
          </View>
        </View>

        {/* Islamic Library */}
        <View className="px-6 mb-8">
          <Text className="text-white font-tajawal font-bold text-xl mb-4">المكتبة الإسلامية</Text>
          <View className="gap-4">

            <TouchableOpacity
              onPress={() => router.push('/tafseer/1/1')}
              className="bg-white/5 border border-white/10 p-5 rounded-2xl flex-row items-center justify-between active:bg-white/10"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 bg-[#1E293B] rounded-xl items-center justify-center border border-white/5">
                  <BookA color="#10B981" size={24} />
                </View>
                <View>
                  <Text className="text-white font-tajawal font-bold text-lg mb-1">التفسير الشامل</Text>
                  <Text className="text-slate-400 font-tajawal text-xs">تفسير الآيات بالذكاء الاصطناعي</Text>
                </View>
              </View>
              <ChevronLeft color="#64748B" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/discover/chat')}
              className="bg-white/5 border border-indigo-500/30 p-5 rounded-2xl flex-row items-center justify-between active:bg-white/10"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 bg-indigo-500/20 rounded-xl items-center justify-center border border-indigo-500/30">
                  <Compass color="#818CF8" size={24} />
                </View>
                <View>
                  <Text className="text-indigo-200 font-tajawal font-bold text-lg mb-1">اسأل نور (AI)</Text>
                  <Text className="text-slate-400 font-tajawal text-xs">مساعدك الذكي للإجابة عن أسئلتك</Text>
                </View>
              </View>
              <ChevronLeft color="#64748B" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Islamic Scientists */}
        <View className="px-6">
          <View className="flex-row items-center gap-2 mb-4">
            <Users color="#F59E0B" size={20} />
            <Text className="text-white font-tajawal font-bold text-xl">علماء المسلمين</Text>
          </View>

          <View className="gap-3">
            {(SCIENTISTS as Scientist[]).map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => router.push(`/scientist/${s.id}`)}
                className="bg-white/5 border border-white/10 p-4 rounded-2xl flex-row items-center justify-between active:bg-white/10"
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center border"
                    style={{ backgroundColor: `${s.color}22`, borderColor: `${s.color}44` }}
                  >
                    <Text className="text-white font-amiri text-xl">{s.name[0]}</Text>
                  </View>
                  <View>
                    <Text className="text-white font-amiri text-lg">{s.name}</Text>
                    <Text className="font-tajawal text-xs mt-0.5" style={{ color: s.color }}>{s.title}</Text>
                  </View>
                </View>
                <ChevronLeft color="#64748B" size={18} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
