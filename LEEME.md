# Activar las licencias en servidor (gratis, ~10 minutos)

1. Creá una cuenta en https://supabase.com y un proyecto nuevo.
2. SQL Editor: pegá y ejecutá `schema.sql`.
3. Edge Functions: creá una función llamada `redeem-code`, pegá `functions/redeem-code/index.ts` y desplegala.
4. Project Settings > API: copiá la "Project URL" y la clave "anon public".
5. En `index.html`, dentro de `COMMERCIAL_CONFIG`, completá `supabaseUrl` y `supabaseAnonKey`.
6. Subí todo a GitHub.

Para vender: insertá el código del cliente con el SQL de `schema.sql` y mandáselo por WhatsApp.
Los códigos vendidos con la versión anterior dejan de funcionar: cargalos en la tabla.
