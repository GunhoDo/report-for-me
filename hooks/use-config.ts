"use client";

// TODO: UserConfig CRUD – Supabase user_configs, sources

export function useConfig() {
  return { config: null, save: async () => {}, isLoading: false };
}
