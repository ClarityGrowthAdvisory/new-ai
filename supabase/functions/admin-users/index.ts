import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerId = claimsData.claims.sub;

    const { data: callerRoles } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    const roleSet = new Set(callerRoles?.map((r: { role: string }) => r.role) || []);
    const isAdmin = roleSet.has("admin");

    if (!isAdmin) {
      return jsonResponse({ error: "Forbidden: admin access required" }, 403);
    }

    const { action, ...params } = await req.json();

    // ACTION: create-user — admin creates client accounts
    if (action === "create-user") {
      const { email, password, name, phone } = params;
      if (!email || !password) {
        return jsonResponse({ error: "Email and password required" }, 400);
      }

      // Check if user with this email already exists
      const { data: existingList } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = existingList?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (existing) {
        return jsonResponse({ error: `A user with email ${email} already exists.` }, 409);
      }

      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || "", phone: phone || "", created_by: callerId },
      });

      if (createError) {
        const msg = createError.message || "Failed to create user";
        const status = /already|registered|exists/i.test(msg) ? 409 : 400;
        return jsonResponse({ error: msg }, status);
      }

      // Ensure client role
      if (newUser.user) {
        await serviceClient.from("user_roles").upsert({
          user_id: newUser.user.id,
          role: "client",
        }, { onConflict: "user_id,role" });
      }

      return jsonResponse({ success: true, user_id: newUser.user?.id });
    }

    // ACTION: update-password
    if (action === "update-password") {
      const { user_id, password } = params;
      if (!user_id || !password) {
        return jsonResponse({ error: "user_id and password required" }, 400);
      }
      if (password.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters" }, 400);
      }

      const { error: updateError } = await serviceClient.auth.admin.updateUserById(user_id, { password });
      if (updateError) {
        return jsonResponse({ error: updateError.message }, 400);
      }

      return jsonResponse({ success: true });
    }

    // ACTION: delete-user
    if (action === "delete-user") {
      const { user_id } = params;
      if (!user_id) {
        return jsonResponse({ error: "user_id required" }, 400);
      }

      // Don't allow admins to delete other admins (basic safety)
      const { data: targetRoles } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id);
      if ((targetRoles || []).some((r: { role: string }) => r.role === "admin")) {
        return jsonResponse({ error: "Cannot delete admin accounts" }, 403);
      }

      const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user_id);
      if (deleteError) {
        return jsonResponse({ error: deleteError.message }, 400);
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err: unknown) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
