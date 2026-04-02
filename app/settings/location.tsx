import { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, MapPin, Search, Navigation, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { CITIES, LOCATION_STORAGE_KEY, SavedLocation } from '../../lib/cities';
import { schedulePrayerNotifications } from '../../lib/notifications';

export default function LocationSettingsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<SavedLocation | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCATION_STORAGE_KEY).then((raw) => {
      if (raw) setSaved(JSON.parse(raw));
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter(
      (c) =>
        c.name.includes(query.trim()) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.country.includes(query.trim())
    );
  }, [query]);

  const selectCity = async (name: string, lat: number, lng: number) => {
    const loc: SavedLocation = { name, lat, lng };
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    setSaved(loc);
    // Immediately reschedule notifications for the new location (fire-and-forget)
    schedulePrayerNotifications(lat, lng).catch(() => {});
    router.back();
  };

  const useGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const cityName = place?.city ?? place?.region ?? 'موقعك الحالي';
      await selectCity(cityName, loc.coords.latitude, loc.coords.longitude);
    } catch {
      setGpsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0F172A]" style={{ direction: 'rtl' }}>
      {/* Header */}
      <View className="px-4 pt-16 pb-4 border-b border-white/5">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 border border-white/10 rounded-full">
            <ChevronRight color="white" size={22} />
          </TouchableOpacity>
          <View>
            <Text className="text-white font-amiri text-2xl">الموقع</Text>
            <Text className="text-slate-400 font-tajawal text-xs">
              {saved ? `الموقع الحالي: ${saved.name}` : 'لم يتم تحديد موقع'}
            </Text>
          </View>
        </View>

        {/* Search box */}
        <View className="flex-row items-center bg-[#1E293B] rounded-2xl border border-white/10 px-4 py-3 gap-3">
          <Search color="#64748B" size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن مدينة..."
            placeholderTextColor="#475569"
            className="flex-1 text-white font-tajawal text-base"
            style={{ textAlign: 'right' }}
          />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* GPS option */}
        <View className="px-4 pt-4 pb-2">
          <TouchableOpacity
            onPress={useGPS}
            disabled={gpsLoading}
            className="flex-row items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-4"
          >
            <View className="flex-row items-center gap-3">
              {gpsLoading
                ? <ActivityIndicator color="#10B981" size="small" />
                : <Navigation color="#10B981" size={20} />}
              <View>
                <Text className="text-emerald-400 font-tajawal font-bold text-base">
                  استخدام الموقع الحالي (GPS)
                </Text>
                <Text className="text-emerald-400/60 font-tajawal text-xs">
                  تحديد تلقائي عبر الجهاز
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* City list */}
        <View className="px-4 pt-2">
          <Text className="text-slate-500 font-tajawal text-xs mb-3 px-1">
            {filtered.length} مدينة
          </Text>
          <View className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
            {filtered.map((city, i) => {
              const isSelected = saved?.name === city.name;
              return (
                <TouchableOpacity
                  key={`${city.nameEn}-${i}`}
                  onPress={() => selectCity(city.name, city.lat, city.lng)}
                  className={`flex-row items-center justify-between px-4 py-4 ${
                    i < filtered.length - 1 ? 'border-b border-white/5' : ''
                  } ${isSelected ? 'bg-emerald-500/10' : ''}`}
                >
                  <View className="flex-row items-center gap-3">
                    {isSelected
                      ? <Check color="#10B981" size={18} />
                      : <MapPin color="#475569" size={18} />}
                    <View>
                      <Text className={`font-tajawal font-bold text-base ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                        {city.name}
                      </Text>
                      <Text className="text-slate-500 font-tajawal text-xs">{city.country}</Text>
                    </View>
                  </View>
                  <Text className="text-slate-600 font-tajawal text-xs">{city.nameEn}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
