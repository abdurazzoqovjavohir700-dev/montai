import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createServerSupabase } from '@/lib/supabase';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    nickname?: string;
    avatar?: string;
    language?: string;
    experienceLevel?: string;
    primarySoftware?: string[];
    focusAreas?: string[];
    skillGoal?: string;
    fontSize?: string;
    onboardingCompleted?: boolean;
  };

  // Sanitize input
  const updates: Record<string, unknown> = {};
  if (body.nickname) updates.nickname = body.nickname.slice(0, 30).trim();
  if (body.avatar) updates.avatar = body.avatar.slice(0, 10);
  if (body.language) updates.language = body.language.slice(0, 10);
  if (body.experienceLevel) updates.experience_level = body.experienceLevel;
  if (body.primarySoftware) updates.primary_software = body.primarySoftware.slice(0, 10);
  if (body.focusAreas) updates.focus_areas = body.focusAreas.slice(0, 15);
  if (body.skillGoal !== undefined) updates.skill_goal = body.skillGoal.slice(0, 500);
  if (body.fontSize) updates.font_size = body.fontSize;
  if (body.onboardingCompleted !== undefined) updates.onboarding_completed = body.onboardingCompleted;
  updates.updated_at = new Date().toISOString();

  const supabase = createServerSupabase();
  const { error } = await supabase.from('users').update(updates).eq('id', user.id);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}
