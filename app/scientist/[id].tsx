import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, MapPin, Calendar, BookOpen } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import SCIENTISTS from '../../assets/data/scientists.json';

interface Scientist {
  id: string;
  name: string;
  nameEn: string;
  born: string;
  died: string;
  origin: string;
  fields: string[];
  title: string;
  summary: string;
  contributions: string[];
  quote: string;
  color: string;
}

export default function ScientistScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const scientist = (SCIENTISTS as Scientist[]).find((s) => s.id === id);

  if (!scientist) {
    return (
      <View className="flex-1 bg-[#0F172A] items-center justify-center">
        <Text className="text-slate-400 font-tajawal text-lg">العالم غير موجود</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-emerald-400 font-tajawal">رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Hero header */}
        <View className="pt-16 pb-8 px-6" style={{ backgroundColor: `${scientist.color}18` }}>
          <TouchableOpacity onPress={() => router.back()} className="mb-6 p-2 border border-white/10 rounded-full self-start">
            <ChevronRight color="white" size={22} />
          </TouchableOpacity>

          {/* Avatar circle */}
          <View className="w-20 h-20 rounded-full items-center justify-center mb-4 border-2" style={{ backgroundColor: `${scientist.color}22`, borderColor: `${scientist.color}55` }}>
            <Text className="text-white font-amiri text-3xl">{scientist.name[0]}</Text>
          </View>

          <Text className="text-white font-amiri text-3xl mb-1">{scientist.name}</Text>
          <Text className="font-tajawal text-sm mb-3" style={{ color: scientist.color }}>{scientist.title}</Text>
          <Text className="text-slate-300 font-tajawal text-xs mb-1" dir="ltr">{scientist.nameEn}</Text>

          <View className="flex-row flex-wrap gap-2 mt-4">
            {scientist.fields.map((f) => (
              <View key={f} className="px-3 py-1 rounded-full border" style={{ backgroundColor: `${scientist.color}18`, borderColor: `${scientist.color}44` }}>
                <Text className="font-tajawal text-xs" style={{ color: scientist.color }}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="px-6 pt-6 gap-6">

          {/* Timeline */}
          <View className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-slate-400 font-tajawal text-sm">{scientist.born} — {scientist.died}</Text>
              <View className="flex-row items-center gap-2">
                <Calendar color="#94A3B8" size={14} />
                <Text className="text-slate-400 font-tajawal text-xs">الفترة الزمنية</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between border-t border-white/5 pt-3">
              <Text className="text-slate-300 font-tajawal text-sm">{scientist.origin}</Text>
              <View className="flex-row items-center gap-2">
                <MapPin color="#94A3B8" size={14} />
                <Text className="text-slate-400 font-tajawal text-xs">المنشأ</Text>
              </View>
            </View>
          </View>

          {/* Summary */}
          <View>
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-1 h-5 rounded-full" style={{ backgroundColor: scientist.color }} />
              <Text className="text-white font-tajawal font-bold text-lg">نبذة</Text>
            </View>
            <Text className="text-slate-300 font-tajawal text-base leading-8 text-right">{scientist.summary}</Text>
          </View>

          {/* Contributions */}
          <View>
            <View className="flex-row items-center gap-2 mb-4">
              <BookOpen size={18} color={scientist.color} />
              <Text className="text-white font-tajawal font-bold text-lg">أبرز الإسهامات</Text>
            </View>
            <View className="gap-3">
              {scientist.contributions.map((c, i) => (
                <View key={i} className="flex-row items-start gap-3 bg-[#1E293B] border border-white/5 rounded-2xl p-4">
                  <Text className="text-white font-tajawal text-base leading-7 flex-1 text-right">{c}</Text>
                  <View className="w-6 h-6 rounded-full items-center justify-center mt-1" style={{ backgroundColor: `${scientist.color}22` }}>
                    <Text className="font-tajawal text-xs font-bold" style={{ color: scientist.color }}>{i + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quote */}
          <View className="rounded-3xl overflow-hidden border border-white/10 mb-4">
            <BlurView intensity={20} tint="dark" className="p-6">
              <Text className="text-white/40 font-amiri text-6xl mb-2 text-right">"</Text>
              <Text className="text-white font-amiri text-xl leading-loose text-right mb-2" style={{ writingDirection: 'rtl' }}>
                {scientist.quote}
              </Text>
              <Text className="font-tajawal text-sm text-right" style={{ color: scientist.color }}>— {scientist.name}</Text>
            </BlurView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
