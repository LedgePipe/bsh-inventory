import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

  // Generate magic link for invite
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  // Send invite email via Resend
  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey) {
    const inviteLink = linkData?.properties?.action_link || ''
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BSH Inventory <harold.ai.caskey@gmail.com>',
        to: [email],
        subject: 'You\'re invited to BSH Inventory',
        html: `
          <h2>Welcome to BSH Inventory!</h2>
          <p>You've been invited to join the Bradshaw Social House inventory system as <strong>${role}</strong>.</p>
          ${inviteLink ? `<p><a href="${inviteLink}" style="background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Accept Invitation</a></p>` : '<p>Please log in at the BSH Inventory app to get started.</p>'}
          <p>— BSH Inventory Team</p>
        `,
      }),
    })
  }

  return NextResponse.json({ success: true, userId: newUser.user.id })
}
