import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { code, device, check } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || typeof device !== "string" || code.length > 40 || device.length > 80) {
    return json({ ok: false, reason: "invalid" }, 400);
  }
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const c = code.trim().toUpperCase();
  const { data: row } = await db.from("licenses").select("*").eq("code", c).maybeSingle();
  if (!row) return json({ ok: false, reason: "invalid" });
  if (row.revoked) return json({ ok: false, reason: "revoked" });
  if (row.device_id && row.device_id !== device) return json({ ok: false, reason: "used" });
  if (!row.device_id) {
    if (check) return json({ ok: false, reason: "invalid" });
    const { data: upd, error } = await db.from("licenses")
      .update({ device_id: device, activated_at: new Date().toISOString() })
      .eq("code", c).is("device_id", null).select();
    if (error || !upd?.length) return json({ ok: false, reason: "used" });
  }
  return json({ ok: true });
});
