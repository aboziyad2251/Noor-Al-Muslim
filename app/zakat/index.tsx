import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Info } from 'lucide-react-native';

// Nisab threshold: value of 85 grams of gold (approximate, shown in SAR)
// User can override with current gold price
const DEFAULT_GOLD_PRICE_PER_GRAM = 250; // SAR — user should update
const NISAB_GOLD_GRAMS = 85;

interface AssetField {
  key: string;
  label: string;
  hint: string;
  isDeduction?: boolean;
}

const ASSET_FIELDS: AssetField[] = [
  { key: 'cash',        label: 'النقد (بنك + يد)',         hint: 'كل المال النقدي والأرصدة البنكية' },
  { key: 'gold',        label: 'قيمة الذهب والفضة',        hint: 'الذهب والفضة المملوكة بالريال' },
  { key: 'investments', label: 'الأسهم والاستثمارات',       hint: 'القيمة السوقية الحالية' },
  { key: 'receivables', label: 'الديون المتوقع سدادها',      hint: 'مبالغ تستحق لك من الغير' },
  { key: 'inventory',   label: 'بضاعة تجارية',              hint: 'قيمة المخزون بسعر البيع' },
  { key: 'debts',       label: 'الديون عليك',              hint: 'ما تدين به لغيرك', isDeduction: true },
  { key: 'expenses',    label: 'النفقات المستحقة',          hint: 'فواتير وإيجارات مستحقة الدفع', isDeduction: true },
];

function toAr(n: number): string {
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ZakatScreen() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [goldPrice, setGoldPrice] = useState(String(DEFAULT_GOLD_PRICE_PER_GRAM));
  const [showResult, setShowResult] = useState(false);

  const parse = (key: string) => parseFloat(values[key] || '0') || 0;

  const nisab = (parseFloat(goldPrice) || DEFAULT_GOLD_PRICE_PER_GRAM) * NISAB_GOLD_GRAMS;

  const totalAssets =
    parse('cash') + parse('gold') + parse('investments') +
    parse('receivables') + parse('inventory');

  const totalDeductions = parse('debts') + parse('expenses');
  const netWealth = Math.max(0, totalAssets - totalDeductions);
  const zakatDue = netWealth >= nisab ? netWealth * 0.025 : 0;
  const aboveNisab = netWealth >= nisab;

  const setValue = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val.replace(/[^0-9.]/g, '') }));
    setShowResult(false);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0F172A]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ direction: 'rtl' }}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Header */}
        <View className="px-4 pt-16 pb-4 flex-row items-center gap-3 border-b border-white/5">
          <TouchableOpacity onPress={() => router.back()} className="p-2 border border-white/10 rounded-full">
            <ChevronRight color="white" size={22} />
          </TouchableOpacity>
          <View>
            <Text className="text-white font-amiri text-2xl">حاسبة الزكاة</Text>
            <Text className="text-slate-400 font-tajawal text-xs">زكاة المال — نصاب الذهب</Text>
          </View>
        </View>

        <View className="px-6 pt-6 gap-6">

          {/* Nisab info */}
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex-row items-start gap-3">
            <Info color="#F59E0B" size={18} />
            <View className="flex-1">
              <Text className="text-amber-400 font-tajawal font-bold text-sm mb-1">النصاب الحالي</Text>
              <Text className="text-amber-200 font-tajawal text-xs leading-6">
                ٨٥ غرام ذهب × سعر الغرام = {toAr(nisab)} ريال
              </Text>
              <View className="flex-row items-center gap-2 mt-3">
                <Text className="text-amber-400 font-tajawal text-xs">سعر غرام الذهب (ريال):</Text>
                <TextInput
                  value={goldPrice}
                  onChangeText={(v) => { setGoldPrice(v.replace(/[^0-9.]/g, '')); setShowResult(false); }}
                  keyboardType="numeric"
                  className="bg-amber-500/20 text-amber-200 font-tajawal text-sm px-3 py-1 rounded-xl border border-amber-500/30 w-24"
                  style={{ textAlign: 'center' }}
                  placeholder="250"
                  placeholderTextColor="#92400E"
                />
              </View>
            </View>
          </View>

          {/* Asset inputs */}
          <View>
            <Text className="text-white font-tajawal font-bold text-lg mb-4">الأصول والمطلوبات</Text>
            <View className="gap-3">
              {ASSET_FIELDS.map(({ key, label, hint, isDeduction }) => (
                <View key={key} className={`bg-white/5 border rounded-2xl p-4 ${isDeduction ? 'border-red-500/20' : 'border-white/10'}`}>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className={`font-tajawal text-xs ${isDeduction ? 'text-red-400' : 'text-slate-400'}`}>
                      {isDeduction ? '(-) ' : '(+) '}{label}
                    </Text>
                  </View>
                  <Text className="text-slate-500 font-tajawal text-xs mb-3">{hint}</Text>
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      value={values[key] ?? ''}
                      onChangeText={(v) => setValue(key, v)}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="#475569"
                      className="flex-1 bg-white/5 text-white font-tajawal px-4 py-3 rounded-xl border border-white/10"
                      style={{ textAlign: 'right' }}
                    />
                    <Text className="text-slate-400 font-tajawal text-sm">ريال</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Calculate button */}
          <TouchableOpacity
            onPress={() => setShowResult(true)}
            className="bg-emerald-500 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-tajawal font-bold text-lg">احسب الزكاة</Text>
          </TouchableOpacity>

          {/* Result */}
          {showResult && (
            <View className={`rounded-3xl p-6 border ${aboveNisab ? 'bg-emerald-900/30 border-emerald-500/40' : 'bg-slate-800/50 border-white/10'}`}>
              <Text className="text-white font-tajawal font-bold text-lg text-center mb-5">نتيجة الحساب</Text>

              <View className="gap-3 mb-5">
                {[
                  { label: 'إجمالي الأصول', value: totalAssets, color: 'text-white' },
                  { label: 'إجمالي الخصوم', value: -totalDeductions, color: 'text-red-400' },
                  { label: 'صافي الثروة الزكوية', value: netWealth, color: 'text-white', bold: true },
                  { label: 'النصاب', value: nisab, color: 'text-amber-400' },
                ].map(({ label, value, color, bold }) => (
                  <View key={label} className="flex-row justify-between items-center py-2 border-b border-white/5">
                    <Text className={`font-tajawal text-sm ${color} ${bold ? 'font-bold' : ''}`}>
                      {toAr(Math.abs(value))} ريال
                    </Text>
                    <Text className="text-slate-400 font-tajawal text-sm">{label}</Text>
                  </View>
                ))}
              </View>

              {aboveNisab ? (
                <View className="items-center bg-emerald-500/20 rounded-2xl p-5 border border-emerald-500/30">
                  <Text className="text-emerald-400 font-tajawal text-sm mb-1">الزكاة الواجبة (٢.٥٪)</Text>
                  <Text className="text-white font-amiri text-4xl font-bold mt-1">{toAr(zakatDue)}</Text>
                  <Text className="text-emerald-400 font-tajawal font-bold text-lg">ريال</Text>
                  <Text className="text-slate-400 font-tajawal text-xs text-center mt-3 leading-5">
                    بشرط مرور الحول الهجري على هذا المال
                  </Text>
                </View>
              ) : (
                <View className="items-center bg-slate-700/30 rounded-2xl p-5">
                  <Text className="text-slate-300 font-tajawal text-base text-center leading-7">
                    صافي ثروتك ({toAr(netWealth)} ريال) أقل من النصاب ({toAr(nisab)} ريال)
                  </Text>
                  <Text className="text-slate-400 font-tajawal text-sm text-center mt-2">
                    لا تجب عليك زكاة هذا العام
                  </Text>
                </View>
              )}

              <Text className="text-slate-500 font-tajawal text-xs text-center mt-4 leading-5">
                هذه الحاسبة للاسترشاد فقط. يُنصح بمراجعة عالم متخصص لحالتك.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
