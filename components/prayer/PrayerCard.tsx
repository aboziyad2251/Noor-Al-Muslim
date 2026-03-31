import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Bell, CheckCircle, ChevronDown } from 'lucide-react-native';

export type PrayerStatus = 'jamaah' | 'on_time' | 'late' | 'qada' | 'missed';

interface PrayerCardProps {
  name: string;
  time: string;
  isNext?: boolean;
  loggedStatus?: PrayerStatus | null;
  onLog?: (status: PrayerStatus) => void;
}

const STATUS_OPTIONS: { key: PrayerStatus; label: string; color: string }[] = [
  { key: 'jamaah',  label: 'في جماعة', color: '#10B981' },
  { key: 'on_time', label: 'في وقتها',  color: '#34D399' },
  { key: 'late',    label: 'متأخراً',   color: '#F59E0B' },
  { key: 'qada',    label: 'قضاء',      color: '#F97316' },
  { key: 'missed',  label: 'فائتة',     color: '#EF4444' },
];

const STATUS_COLOR: Record<PrayerStatus, string> = {
  jamaah:  '#10B981',
  on_time: '#34D399',
  late:    '#F59E0B',
  qada:    '#F97316',
  missed:  '#EF4444',
};

export default function PrayerCard({ name, time, isNext = false, loggedStatus, onLog }: PrayerCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const logged = !!loggedStatus;
  const dotColor = loggedStatus ? STATUS_COLOR[loggedStatus] : undefined;

  const handleSelect = (status: PrayerStatus) => {
    setShowMenu(false);
    onLog?.(status);
  };

  const cardBg = isNext
    ? 'bg-emerald-500 border-emerald-400/50'
    : logged
    ? 'bg-white/5 border-white/10'
    : 'bg-white/5 border-white/5';

  return (
    <>
      <View className={`flex-row items-center justify-between p-4 rounded-2xl border mb-3 ${cardBg}`}>
        {/* Left: log button */}
        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          className="w-9 h-9 rounded-full items-center justify-center border"
          style={{
            borderColor: dotColor ?? (isNext ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'),
            backgroundColor: dotColor ? `${dotColor}22` : 'transparent',
          }}
        >
          {logged ? (
            <CheckCircle color={dotColor} size={18} />
          ) : (
            <ChevronDown color={isNext ? 'white' : '#64748B'} size={16} />
          )}
        </TouchableOpacity>

        {/* Center: name */}
        <Text className={`flex-1 text-center font-tajawal font-semibold text-base mx-2 ${isNext ? 'text-white' : 'text-slate-200'}`}>
          {name}
        </Text>

        {/* Right: time + bell */}
        <View className="flex-row items-center gap-2">
          <Text className={`font-tajawal text-sm ${isNext ? 'text-white font-bold' : 'text-slate-300'}`}>{time}</Text>
          {isNext && <Bell color="white" size={16} />}
        </View>
      </View>

      {/* Status picker modal */}
      <Modal transparent visible={showMenu} animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable className="flex-1 bg-black/60 items-center justify-center" onPress={() => setShowMenu(false)}>
          <View className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 w-72">
            <Text className="text-white font-tajawal font-bold text-lg text-center mb-5">
              سجّل صلاة {name}
            </Text>
            {STATUS_OPTIONS.map(({ key, label, color }) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleSelect(key)}
                className="flex-row items-center justify-between py-3 border-b border-white/5"
              >
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <Text className="text-white font-tajawal text-base flex-1 text-right mr-3">{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowMenu(false)} className="mt-4 items-center">
              <Text className="text-slate-400 font-tajawal text-sm">إلغاء</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
