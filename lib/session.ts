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

// Soft rate limit — 500 requests/hour per user (Groq provider limits are the real bottleneck).
// Never hard-blocks users. Returns remaining count for informational logging only.
export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const HOURLY_LIMIT = 500;
  const supabase = createServerSupabase();
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('count, window_start')
      .eq('user_id', userId)
      .single();

    if (error || !data || new Date(data.window_start) < new Date(windowStart)) {
      await supabase.from('rate_limits').upsert({
        user_id: userId,
        count: 1,
        window_start: new Date().toISOString(),
      });
      return { allowed: true, remaining: HOURLY_LIMIT - 1 };
    }

    if (data.count >= HOURLY_LIMIT) {
      // Even at hard limit: still allow but log it
      return { allowed: true, remaining: 0 };
    }

    await supabase
      .from('rate_limits')
      .update({ count: data.count + 1 })
      .eq('user_id', userId);

    return { allowed: true, remaining: HOURLY_LIMIT - data.count - 1 };
  } catch {
    // Never block on DB error
    return { allowed: true, remaining: HOURLY_LIMIT };
  }
}
