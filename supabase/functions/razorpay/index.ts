import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }
  const userId = claimsData.claims.sub;

  const { action, ...body } = await req.json();

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Load Razorpay credentials dynamically from payment_settings, fall back to env
  let RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "";
  let RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";
  const { data: settings } = await adminClient
    .from("payment_settings")
    .select("razorpay_key_id, razorpay_key_secret, is_active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (settings && action !== "activate-free") {
    if (settings.is_active === false) {
      return new Response(
        JSON.stringify({ error: "Payments are currently disabled" }),
        { status: 503, headers: corsHeaders }
      );
    }
    if (settings.razorpay_key_id) RAZORPAY_KEY_ID = settings.razorpay_key_id;
    if (settings.razorpay_key_secret) RAZORPAY_KEY_SECRET = settings.razorpay_key_secret;
  }

  if (action !== "activate-free" && (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET)) {
    return new Response(
      JSON.stringify({ error: "Payment gateway not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    if (action === "activate-free") {
      const { plan_id } = body;
      const { data: freePlan } = await adminClient
        .from("plans")
        .select("id, price, validity_days, is_active")
        .eq("id", plan_id)
        .maybeSingle();

      if (!freePlan || !freePlan.is_active || Number(freePlan.price) > 0) {
        return new Response(JSON.stringify({ error: "Plan is not free" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const { data: existingFree } = await adminClient
        .from("user_plans")
        .select("id, expires_at")
        .eq("user_id", userId)
        .maybeSingle();

      const baseFree =
        existingFree?.expires_at && new Date(existingFree.expires_at) > new Date()
          ? new Date(existingFree.expires_at)
          : new Date();
      const freeExpires = new Date(baseFree);
      freeExpires.setDate(freeExpires.getDate() + (freePlan.validity_days || 30));

      if (existingFree) {
        await adminClient
          .from("user_plans")
          .update({
            plan_id: freePlan.id,
            expires_at: freeExpires.toISOString(),
            assigned_at: new Date().toISOString(),
          })
          .eq("id", existingFree.id);
      } else {
        await adminClient.from("user_plans").insert({
          user_id: userId,
          plan_id: freePlan.id,
          expires_at: freeExpires.toISOString(),
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-order") {
      const { plan_id, is_renewal } = body;

      // Verify plan exists and get its price
      const { data: plan } = await adminClient
        .from("plans")
        .select("id, name, price, validity_days")
        .eq("id", plan_id)
        .single();

      // Use plan price from database (in rupees), convert to paise
      const amount = (plan?.price || 999) * 100;

      if (!plan) {
        return new Response(JSON.stringify({ error: "Plan not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      // Create Razorpay order
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
        },
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt: `plan_${plan_id}_${Date.now()}`,
          notes: { user_id: userId, plan_id, is_renewal: String(is_renewal) },
        }),
      });

      if (!rzpRes.ok) {
        const err = await rzpRes.text();
        console.error("Razorpay order error:", err);
        return new Response(JSON.stringify({ error: "Failed to create order" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      const order = await rzpRes.json();

      // Save record
      await adminClient.from("payment_records").insert({
        user_id: userId,
        plan_id,
        razorpay_order_id: order.id,
        amount: amount / 100,
        is_renewal,
        status: "created",
      });

      return new Response(
        JSON.stringify({ order_id: order.id, amount, currency: "INR", key_id: RAZORPAY_KEY_ID }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify-payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

      // Verify signature using HMAC SHA256
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(RAZORPAY_KEY_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureData = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signatureData));
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSignature !== razorpay_signature) {
        return new Response(JSON.stringify({ error: "Invalid payment signature" }), {
          status: 400,
          headers: corsHeaders,
        });
      }




      // Update payment record
      await adminClient
        .from("payment_records")
        .update({
          razorpay_payment_id,
          razorpay_signature,
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", razorpay_order_id);

      // Get payment record to find plan
      const { data: payment } = await adminClient
        .from("payment_records")
        .select("plan_id, user_id, is_renewal")
        .eq("razorpay_order_id", razorpay_order_id)
        .single();

      if (payment) {
        // Plan duration comes from the plan itself
        const { data: paidPlan } = await adminClient
          .from("plans")
          .select("validity_days")
          .eq("id", payment.plan_id)
          .maybeSingle();
        const validityDays = paidPlan?.validity_days || 30;

        // Upsert user_plan (renewals extend from the current expiry if still active)
        const { data: existing } = await adminClient
          .from("user_plans")
          .select("id, expires_at")
          .eq("user_id", payment.user_id)
          .maybeSingle();

        const base =
          existing?.expires_at && new Date(existing.expires_at) > new Date()
            ? new Date(existing.expires_at)
            : new Date();
        const expiresAt = new Date(base);
        expiresAt.setDate(expiresAt.getDate() + validityDays);

        if (existing) {
          await adminClient
            .from("user_plans")
            .update({
              plan_id: payment.plan_id,
              expires_at: expiresAt.toISOString(),
              assigned_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await adminClient.from("user_plans").insert({
            user_id: payment.user_id,
            plan_id: payment.plan_id,
            expires_at: expiresAt.toISOString(),
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Razorpay function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
