import { supabase } from './supabase';

/**
 * GLM-4.7 API integration layer.
 * All requests MUST go through Supabase Edge Functions — API key never touches the app.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AICompanionRequest {
  message: string;
  history?: ChatMessage[];
  language: 'ar' | 'en';
}

export interface TafseerRequest {
  surahNumber: number;
  ayahNumber: number;
  ayahText: string;
  language: 'ar' | 'en';
}

export interface DuaFinderRequest {
  situation: string;
  language: 'ar' | 'en';
}

export interface HadithAuthRequest {
  hadithText: string;
  language: 'ar' | 'en';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function invokeFunction(name: string, body: any): Promise<string> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  // Handle both OpenAI-style and Anthropic-style response shapes
  return (
    data?.choices?.[0]?.message?.content ||
    data?.content?.[0]?.text ||
    data?.result ||
    'عذرًا، لم أتمكن من معالجة طلبك الآن.'
  );
}

export async function generateAICompanionResponse(req: AICompanionRequest): Promise<string> {
  return invokeFunction('ai-companion', req);
}

export async function generateTafseer(req: TafseerRequest): Promise<string> {
  return invokeFunction('tafseer', req);
}

export async function findDua(req: DuaFinderRequest): Promise<string> {
  return invokeFunction('dua-finder', req);
}

export async function checkHadithAuthenticity(req: HadithAuthRequest): Promise<string> {
  return invokeFunction('hadith-auth', req);
}
