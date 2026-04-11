/**
 * Admin authentication guard for ShipRocket admin Edge Functions.
 *
 * USAGE
 * ─────
 *   import { assertAdminUser, AdminAuthError } from "../_shared/admin-auth.ts";
 *
 *   const adminUserId = await assertAdminUser(req, serviceClient);
 *
 * Uses the existing user_roles table and has_role() SQL function
 * from 20260313_create_orders_and_policies.sql.
 *
 * Throws AdminAuthError (caught by the handler to return 401/403).
 */

// @ts-expect-error: Deno runtime URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

// ─── Typed error ─────────────────────────────────────────────────────────────

export class AdminAuthError extends Error {
  readonly httpStatus: number;

  constructor(message: string, httpStatus: number = 403) {
    super(message);
    this.name = "AdminAuthError";
    this.httpStatus = httpStatus;
  }
}

// ─── Exported guard ──────────────────────────────────────────────────────────

/**
 * Validates that the request comes from an authenticated admin user.
 *
 * @param req              The incoming Request object (reads Authorization header)
 * @param serviceClient    Supabase client created with SERVICE_ROLE_KEY
 *                         (used to call has_role via RPC, bypassing RLS)
 * @returns                The admin user's UUID (string) — used for audit log called_by
 * @throws AdminAuthError  If the user is not authenticated or not an admin
 */
// deno-lint-ignore no-explicit-any
export async function assertAdminUser(req: Request, serviceClient: any): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new AdminAuthError("Missing Authorization header", 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new AdminAuthError("Server configuration error", 500);
  }

  // Validate JWT and resolve user via a user-scoped client
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    throw new AdminAuthError("Unauthorized", 401);
  }

  // Check admin role via the existing has_role() SQL function
  // Using service client to bypass RLS on user_roles
  const { data: isAdmin, error: roleError } = await serviceClient.rpc(
    "has_role",
    { _user_id: user.id, _role: "admin" },
  );

  if (roleError) {
    console.error("[admin-auth] role check failed:", roleError);
    throw new AdminAuthError("Role verification failed", 500);
  }

  if (!isAdmin) {
    throw new AdminAuthError("Forbidden — admin role required", 403);
  }

  return user.id;
}
