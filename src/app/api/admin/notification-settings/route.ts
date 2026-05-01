import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

async function verifyAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function GET() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('notification_recipients')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recipients: data })
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { action, id, email, name } = await request.json()

  if (action === 'add') {
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    const { error } = await supabaseAdmin
      .from('notification_recipients')
      .insert({ email, name: name || null, active: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'remove') {
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { error } = await supabaseAdmin
      .from('notification_recipients')
      .delete()
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'toggle') {
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    // Get current state then toggle
    const { data: current } = await supabaseAdmin
      .from('notification_recipients')
      .select('active')
      .eq('id', id)
      .single()
    const { error } = await supabaseAdmin
      .from('notification_recipients')
      .update({ active: !current?.active })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
