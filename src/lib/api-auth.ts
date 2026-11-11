import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export type SignedInProfile = {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin' | 'manager' | 'staff' | string
}

/**
 * Returns the signed-in user's profile for an API route, or null when the
 * request has no valid session. Use it to refuse anonymous calls before any
 * service-role work or email sending happens.
 */
export async function getSignedInProfile(): Promise<SignedInProfile | null> {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single()

  return (profile as SignedInProfile | null) ?? null
}

/** Escapes text before it is placed inside email HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
