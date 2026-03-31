import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email.trim()) return 'الرجاء إدخال البريد الإلكتروني';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'البريد الإلكتروني غير صحيح';
    if (password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (mode === 'signup' && !displayName.trim()) return 'الرجاء إدخال اسمك';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signup') {
        // 1. SIGN UP LOGIC
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              display_name: displayName, // Saves their name in Supabase auth metadata
            },
          },
        });

        if (error) throw error;

        // Success! Tell them to log in now.
        setSuccessMsg('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
        setMode('signin');
        setPassword(''); // Clear password for security

      } else {
        // 2. SIGN IN LOGIC
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;

        // Success! Send them to the main app screen
        router.replace('/');
      }
    } catch (error: any) {
      // Catches any errors from signing up OR signing in
      setErrorMsg(error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-900" // Dark background for a sleek, modern look
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>

        {/* Header Section */}
        <View className="mb-10 items-center">
          <Text className="text-3xl font-bold text-white mb-2">
            {mode === 'signin' ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
          </Text>
          <Text className="text-slate-400">
            {mode === 'signin' ? 'سجل دخولك للمتابعة مع نور' : 'انضم إلينا وابدأ رحلتك'}
          </Text>
        </View>

        {/* Dynamic Error & Success Messages */}
        {errorMsg && (
          <View className="bg-red-500/10 p-4 rounded-xl mb-6 border border-red-500/50">
            <Text className="text-red-400 text-center font-medium">{errorMsg}</Text>
          </View>
        )}
        {successMsg && (
          <View className="bg-emerald-500/10 p-4 rounded-xl mb-6 border border-emerald-500/50">
            <Text className="text-emerald-400 text-center font-medium">{successMsg}</Text>
          </View>
        )}

        {/* Input Fields */}
        <View className="space-y-4">

          {/* Display Name (Only shows during Sign Up) */}
          {mode === 'signup' && (
            <View className="flex-row items-center bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <TextInput
                placeholder="الاسم الكريم"
                placeholderTextColor="#94a3b8"
                value={displayName}
                onChangeText={setDisplayName}
                className="flex-1 text-white text-right text-base"
              />
            </View>
          )}

          {/* Email Input */}
          <View className="flex-row items-center bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <TextInput
              placeholder="البريد الإلكتروني"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 text-white text-right text-base mr-3"
            />
            <Mail color="#94a3b8" size={22} />
          </View>

          {/* Password Input with Eye Toggle */}
          <View className="flex-row items-center bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff color="#94a3b8" size={22} /> : <Eye color="#94a3b8" size={22} />}
            </TouchableOpacity>
            <TextInput
              placeholder="كلمة المرور"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              className="flex-1 text-white text-right text-base mr-3 ml-3"
            />
            <Lock color="#94a3b8" size={22} />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className="bg-emerald-600 rounded-2xl p-4 mt-8 items-center justify-center flex-row shadow-lg shadow-emerald-900"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-bold text-xl mr-2">
                {mode === 'signin' ? 'دخول' : 'تسجيل'}
              </Text>
              <ChevronRight color="white" size={24} />
            </>
          )}
        </TouchableOpacity>

        {/* Toggle Sign In / Sign Up Screen */}
        <TouchableOpacity
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setErrorMsg(null);
            setSuccessMsg(null);
            setPassword(''); // Clear password when switching screens
          }}
          className="mt-8 items-center p-2"
        >
          <Text className="text-slate-400 text-base">
            {mode === 'signin' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
            <Text className="text-emerald-400 font-bold">
              {mode === 'signin' ? 'إنشاء حساب جديد' : 'سجل دخولك'}
            </Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}