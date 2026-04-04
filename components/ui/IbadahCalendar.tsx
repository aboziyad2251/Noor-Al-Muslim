import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHeatmapData } from '../../lib/ibadah-log';

const PRAYER_LOG_KEY = 'noor_prayer_logs';

const SCORE_COLORS = [
  'transparent',   // 0 — no activity
  '#064E3B',       // 1 — prayer only
  '#059669',       // 2 — prayer + one more
  '#10B981',       // 3 — all three
];

const SCORE_BORDER = [
  '#1E293B',
  '#065F46',
  '#047857',
  '#34D399',
];

const DAY_LABELS = ['ج', 'خ', 'ر', 'ث', 'ن', 'ح', 'س']; // Fri→Sat (RTL order)

const WEEKS = 13; // ~3 months
const TOTAL_DAYS = WEEKS * 7;

export default function IbadahCalendar() {
  const [cells, setCells] = useState<{ date: string; score: number }[]>([]);
  const [totals, setTotals] = useState({ prayers: 0, azkar: 0, quran: 0 });

  useEffect(() => {
    async function load() {
      const raw = await AsyncStorage.getItem(PRAYER_LOG_KEY);
      const prayerLogs = raw ? JSON.parse(raw) : {};
      const data = await getHeatmapData(prayerLogs, TOTAL_DAYS);
      setCells(data);

      // Compute totals for the legend
      let prayers = 0, azkar = 0, quran = 0;
      const ibadahRaw = await AsyncStorage.getItem('noor_ibadah_log');
      const ibadahLog = ibadahRaw ? JSON.parse(ibadahRaw) : {};
      data.forEach(({ date }) => {
        if (prayerLogs[date] && Object.keys(prayerLogs[date]).length > 0) prayers++;
        if (ibadahLog[date]?.azkar) azkar++;
        if (ibadahLog[date]?.quran) quran++;
      });
      setTotals({ prayers, azkar, quran });
    }
    load();
  }, []);

  // Pad start so first day aligns to the correct column
  const firstDate = cells[0] ? new Date(cells[0].date) : new Date();
  // getDay(): 0=Sun,1=Mon...6=Sat. We want columns Sat→Fri.
  // Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
  const dayIndex = (firstDate.getDay() + 1) % 7; // shift so Sat=0
  const padded: ({ date: string; score: number } | null)[] = [
    ...Array(dayIndex).fill(null),
    ...cells,
  ];

  // Split into columns of 7 (each column = one week)
  const columns: ({ date: string; score: number } | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    columns.push(padded.slice(i, i + 7));
  }

  return (
    <View>
      {/* Day labels */}
      <View className="flex-row mb-1 mr-0" style={{ marginRight: 0 }}>
        <View style={{ width: 20 }} />
        {DAY_LABELS.map((d) => (
          <View key={d} style={{ width: 16, marginHorizontal: 2 }} className="items-center">
            <Text className="text-slate-600 font-tajawal" style={{ fontSize: 9 }}>{d}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1">
          {columns.map((col, colIdx) => {
            // Month label for first cell of each column if month changes
            const firstCell = col.find((c) => c !== null);
            const showMonth = firstCell && colIdx > 0 && new Date(firstCell.date).getDate() <= 7;
            const monthLabel = firstCell
              ? new Date(firstCell.date).toLocaleDateString('ar-SA', { month: 'short' })
              : '';

            return (
              <View key={colIdx} style={{ width: 16 }}>
                {showMonth ? (
                  <Text className="text-slate-600 font-tajawal mb-1" style={{ fontSize: 8 }}>
                    {monthLabel}
                  </Text>
                ) : (
                  <View style={{ height: 13 }} />
                )}
                {col.map((cell, rowIdx) => (
                  <View
                    key={rowIdx}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      marginBottom: 2,
                      backgroundColor: cell ? SCORE_COLORS[cell.score] : 'transparent',
                      borderWidth: 1,
                      borderColor: cell ? SCORE_BORDER[cell.score] : 'transparent',
                    }}
                  />
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Stats row */}
      <View className="flex-row gap-4 mt-4 pt-4 border-t border-white/5">
        {[
          { label: 'أيام صلّيت', value: totals.prayers, color: '#10B981' },
          { label: 'أيام أذكار', value: totals.azkar,   color: '#6366F1' },
          { label: 'أيام قرآن',  value: totals.quran,   color: '#F59E0B' },
        ].map((s) => (
          <View key={s.label} className="flex-1 items-center">
            <Text className="font-tajawal font-bold text-lg" style={{ color: s.color }}>{s.value}</Text>
            <Text className="text-slate-500 font-tajawal text-xs text-center">{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Score legend */}
      <View className="flex-row items-center gap-2 mt-3">
        <Text className="text-slate-600 font-tajawal text-xs">أقل</Text>
        {SCORE_COLORS.map((bg, i) => (
          <View
            key={i}
            style={{
              width: 12, height: 12, borderRadius: 2,
              backgroundColor: bg,
              borderWidth: 1, borderColor: SCORE_BORDER[i],
            }}
          />
        ))}
        <Text className="text-slate-600 font-tajawal text-xs">أكثر</Text>
      </View>
    </View>
  );
}
