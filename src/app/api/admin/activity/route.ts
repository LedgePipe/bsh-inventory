import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const [submissions, snapshots] = await Promise.all([
    supabaseAdmin
      .from('count_submissions')
      .select('id, submitted_by, submission_type, items_data, submitted_at, notification_sent')
      .order('submitted_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('count_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Get profile names for submissions
  const userIds = Array.from(new Set((submissions.data || []).map((s: any) => s.submitted_by)))
  const { data: profiles } = userIds.length > 0
    ? await supabaseAdmin.from('profiles').select('id, email, full_name').in('id', userIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))

  const enrichedSubmissions = (submissions.data || []).map(s => ({
    ...s,
    submitter: profileMap[s.submitted_by] || { email: 'Unknown', full_name: null },
  }))

  return NextResponse.json({
    submissions: enrichedSubmissions,
    snapshots: snapshots.data || [],
  })
}
