"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import {
  clearCachedUserData,
  getCacheOwner,
  setCacheOwner,
  syncUserData,
} from "@/lib/userData";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  supabase: ReturnType<typeof createClient>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Synchronously read Supabase session from localStorage to avoid async delay on PWA startup
function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (!key) return null;
    const data = JSON.parse(localStorage.getItem(key) ?? "null");
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedUser = useMemo(() => readStoredUser(), []);
  const hasCacheOwner =
    typeof window !== "undefined" &&
    localStorage.getItem("hadami-cache-owner") !== null;

  const [user, setUser] = useState<User | null>(storedUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  // If we have both a stored session and cached data, skip the loading screen
  const [loading, setLoading] = useState(!(storedUser && hasCacheOwner));
  const syncSequence = useRef(0);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  const supabase = supabaseRef.current;

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", userId)
      .single();
    return data;
  }, [supabase]);

  const syncAuthState = useCallback(async (nextUser: User | null) => {
    const syncId = ++syncSequence.current;
    const currentOwner = getCacheOwner();

    setUser(nextUser);

    if (!nextUser) {
      setLoading(true);
      setProfile(null);

      if (currentOwner) {
        clearCachedUserData();
      }

      if (syncId === syncSequence.current) {
        setLoading(false);
      }
      return;
    }

    const cacheValid = currentOwner === nextUser.id;

    if (cacheValid) {
      // キャッシュが有効なら即表示し、最新化は裏で進める
      setLoading(false);
      fetchProfile(nextUser.id).then((profileData) => {
        if (syncId === syncSequence.current) {
          setProfile(profileData ?? null);
        }
      });
      syncUserData(supabase, nextUser.id).catch((error) =>
        console.error("Background sync failed:", error)
      );
      return;
    }

    setLoading(true);
    clearCachedUserData();

    try {
      // Fetch profile first (small query), then show home page immediately
      const profileData = await fetchProfile(nextUser.id);

      if (syncId !== syncSequence.current) return;

      setProfile(profileData ?? null);
      setCacheOwner(nextUser.id);
      setLoading(false);

      // Sync remaining data in background (products, zukan, deck)
      syncUserData(supabase, nextUser.id).catch((error) =>
        console.error("Background sync failed:", error)
      );
    } catch (error) {
      if (syncId !== syncSequence.current) return;
      console.error("Failed to fetch profile:", error);
      clearCachedUserData();
      setLoading(false);
    }
  }, [fetchProfile, supabase]);

  useEffect(() => {
    let mounted = true;

    // onAuthStateChange fires INITIAL_SESSION from localStorage (no network round-trip)
    // This makes PWA startup instant. Token revalidation happens automatically
    // when Supabase detects expiry and fires TOKEN_REFRESHED / SIGNED_OUT.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      void syncAuthState(session?.user ?? null);
    });

    // Safety timeout: if loading hasn't resolved in 5 seconds, force it off
    // so the user isn't stuck on the loading screen forever
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading((prev) => {
          if (prev) console.warn("Auth loading timed out – forcing UI to render");
          return false;
        });
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [supabase, syncAuthState]);

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    const profileData = await fetchProfile(user.id);
    setProfile(profileData ?? null);
    return profileData ?? null;
  }, [fetchProfile, user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    supabase,
    refreshProfile,
  }), [loading, profile, refreshProfile, supabase, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useUser() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useUser must be used within AuthProvider");
  }

  return context;
}
