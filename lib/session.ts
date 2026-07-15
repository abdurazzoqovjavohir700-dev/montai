import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { createServerSupabase } from './supabase';
import type { User } from './types';

export async function getSessionUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    nickname: data.nickname,
    avatar: data.avatar,
    language: data.language,
    experienceLevel: data.experience_level,
    primarySoftware: data.primary_software ?? [],
    focusAreas: data.focus_areas ?? [],
    skillGoal: data.skill_goal ?? '',
    fontSize: data.font_size ?? 'md',
    onboardingCompleted: data.onboarding_completed,
    createdAt: data.created_at,
  };
}

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServerSupabase();
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

  const { data, error } = await supabase
    .from('rate_limits')
    .select('count, window_start')
    .eq('user_id', userId)
    .single();

  if (error || !data || new Date(data.window_start) < new Date(windowStart)) {
    // Reset window
    await supabase.from('rate_limits').upsert({
      user_id: userId,
      count: 1,
      window_start: new Date().toISOString(),
    });
    return { allowed: true, remaining: 29 };
  }

  if (data.count >= 30) {
    return { allowed: false, remaining: 0 };
  }

  await supabase
    .from('rate_limits')
    .update({ count: data.count + 1 })
    .eq('user_id', userId);

  return { allowed: true, remaining: 30 - data.count - 1 };
}
