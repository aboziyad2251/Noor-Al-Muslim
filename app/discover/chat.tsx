import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ChevronRight, Send, Compass, Sparkles, Crown } from 'lucide-react-native';
import { generateAICompanionResponse } from '../../lib/glm';
import { useRevenueCat, FREE_AI_LIMIT } from '../../hooks/useRevenueCat';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AskNoorScreen() {
  const router = useRouter();
  const { isPremium, canUseAI, aiCallsToday, trackAICall } = useRevenueCat();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'intro',
    role: 'assistant',
    content: 'السلام عليكم! أنا "نور"، المساعد الذكي الخاص بك. كيف يمكنني مساعدتك اليوم في أمور دينك ودنياك؟'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom whenever messages update
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!canUseAI) {
      const limitMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `لقد استخدمت حدّك المجاني اليوم (${FREE_AI_LIMIT} رسائل). اشترك في نور بريميوم للحصول على محادثات غير محدودة.`,
      };
      setMessages(prev => [...prev, limitMsg]);
      return;
    }

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await trackAICall();

    try {
      // Call the proxy to GLM-4.7 passing context
      // Pass the actual message + conversation history (skip the static intro)
      const history = messages
        .filter((m) => m.id !== 'intro')
        .map((m) => ({ role: m.role, content: m.content }));

      const responseText = await generateAICompanionResponse({
        message: userMessage.content,
        history,
        language: 'ar',
      });
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || 'عذراً، لم أتمكن من معالجة طلبك الآن. يرجى المحاولة لاحقاً.'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-[#0F172A]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ direction: 'rtl' }}
    >
      {/* Header NavBar */}
      <BlurView intensity={20} tint="dark" className="pt-16 pb-4 px-4 flex-row justify-between items-center border-b border-indigo-500/20 bg-indigo-900/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 border border-white/10 rounded-full">
          <ChevronRight color="white" size={24} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <View className="bg-indigo-500/20 p-2 rounded-full border border-indigo-500/30">
            <Compass color="#818CF8" size={20} />
          </View>
          <Text className="text-white font-amiri text-2xl font-bold">اسأل نور</Text>
        </View>
        <View className="w-10">
             {/* Invisible placeholder for symmetry */}
        </View>
      </BlurView>

      {/* Chat Messages */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-4" 
        contentContainerStyle={{ paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6 gap-2">
          <View className="bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 flex-row items-center gap-2">
            <Sparkles color="#818CF8" size={16} />
            <Text className="text-indigo-300 font-tajawal text-xs">تعمل هذه الخاصية بالذكاء الاصطناعي</Text>
          </View>
          {!isPremium && (
            <TouchableOpacity
              onPress={() => router.push('/premium')}
              className="flex-row items-center gap-2 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20"
            >
              <Crown color="#F59E0B" size={12} />
              <Text className="text-amber-400 font-tajawal text-xs">
                {canUseAI ? `${FREE_AI_LIMIT - aiCallsToday} رسالة مجانية متبقية اليوم` : 'تجاوزت الحد اليومي · اشترك الآن'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {messages.map((msg) => (
          <View 
            key={msg.id} 
            className={`mb-4 max-w-[85%] rounded-3xl p-4 ${
              msg.role === 'user' 
                ? 'self-end bg-emerald-600 rounded-tr-sm' 
                : 'self-start bg-[#1E293B] border border-white/5 rounded-tl-sm'
            }`}
          >
            <Text className={`font-tajawal text-base leading-7 ${msg.role === 'user' ? 'text-white' : 'text-slate-200'}`} style={{ textAlign: 'right' }}>
              {msg.content}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View className="self-start bg-[#1E293B] border border-white/5 rounded-3xl rounded-tl-sm p-4 mb-4">
            <ActivityIndicator size="small" color="#818CF8" />
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View className="px-4 py-4 pb-8 border-t border-white/10 bg-[#0F172A]">
        <View className="flex-row items-end gap-3 rounded-3xl bg-[#1E293B] border border-white/10 pr-4 pl-2 py-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="اسأل سؤالاً دينياً..."
            placeholderTextColor="#64748B"
            multiline
            className="flex-1 max-h-32 text-white font-tajawal text-right min-h-[44px]"
            keyboardAppearance="dark"
            style={{ textAlign: 'right' }}
          />
          <TouchableOpacity 
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`w-12 h-12 rounded-full items-center justify-center mb-1 ${
              input.trim() && !isLoading ? 'bg-indigo-500' : 'bg-slate-700'
            }`}
          >
            <Send color={input.trim() && !isLoading ? 'white' : '#94A3B8'} size={20} style={{ transform: [{ rotate: '180deg'}] }} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
