import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkRole = async () => {
      // Query user_roles table directly (avoids RPC overload ambiguity)
      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleError) {
        setIsAdmin(roleRow !== null);
        setLoading(false);
        return;
      }

      console.warn("user_roles query failed, falling back to profiles:", roleError.message);

      // Fallback: check profiles.is_admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(profile?.is_admin === true);
      setLoading(false);
    };

    checkRole();
  }, [user]);

  return { isAdmin, loading };
};
