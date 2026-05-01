import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { email, role } = await request.json()
  if (!email || !['admin', 'manager', 'staff'].includes(role)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  // Create user via Supabase admin API (generates invite)
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { role },
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

  // Create profile
  await supabaseAdmin.from('profiles').upsert({
    id: newUser.user.id,
    email,
    role,
    full_name: null,
  })

  // Send invite via Supabase built-in email (works without domain verification)
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  if (inviteError) {
    console.error('Invite email error:', inviteError)
    // Non-fatal — user is already created, they can use password reset to get in
  }

  return NextResponse.json({ success: true, userId: newUser.user.id })
}
