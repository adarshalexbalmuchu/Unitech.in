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
      // Try RPC first
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!error) {
        setIsAdmin(data === true);
        setLoading(false);
        return;
      }

      console.warn("has_role RPC failed, falling back to direct query:", error.message);

      // Fallback: query user_roles table directly
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

      // Final fallback: check profiles.is_admin
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
