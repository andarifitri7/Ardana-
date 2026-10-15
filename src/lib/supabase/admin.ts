import { createClient } from '@supabase/supabase-js';

// Admin service role client for privileged backend operations (Webhook, Cron, Admin Impersonation)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-tatadana.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key';

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
