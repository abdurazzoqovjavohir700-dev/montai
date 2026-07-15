import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { createServerSupabase } from './supabase';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    })] : []),
    ...(process.env.GITHUB_CLIENT_ID ? [GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    })] : []),
  ],
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const supabase = createServerSupabase();
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!existing) {
        const nickname = user.name?.split(' ')[0] ?? 'Editor';
        await supabase.from('users').insert({
          email: user.email,
          nickname,
          avatar: '🎬',
          language: 'en',
          experience_level: 'beginner',
          primary_software: [],
          focus_areas: [],
          skill_goal: '',
          font_size: 'md',
          onboarding_completed: false,
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const supabase = createServerSupabase();
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, onboarding_completed, nickname, language')
          .eq('email', session.user.email)
          .single();

        if (dbUser) {
          (session as { user: Record<string, unknown> }).user.id = dbUser.id;
          (session as { user: Record<string, unknown> }).user.onboardingCompleted =
            dbUser.onboarding_completed;
          (session as { user: Record<string, unknown> }).user.nickname = dbUser.nickname;
          (session as { user: Record<string, unknown> }).user.language = dbUser.language;
        }
      }
      void token;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
};
