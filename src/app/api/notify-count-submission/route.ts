import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface CountItem {
  itemId: string
  newCount: number
  productName: string
  parLevel: number
}

interface NotifyRequest {
  submittedBy: string
  submissionType: string
  itemsData: CountItem[]
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyRequest = await request.json()
    const { submittedBy, submissionType, itemsData } = body

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Fetch notification recipients from config table, fallback to managers
    let managerEmails: string[] = []
    const { data: recipients, error: recipientsError } = await supabase
      .from('notification_recipients')
      .select('email')
      .eq('active', true)

    if (!recipientsError && recipients && recipients.length > 0) {
      managerEmails = recipients.map(r => r.email)
    } else {
      // Fallback: fetch managers/admins
      const { data: managers } = await supabase
        .from('profiles')
        .select('email')
        .in('role', ['admin', 'manager'])
      managerEmails = managers?.map(m => m.email) || []
    }

    // Format the email body
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    const itemsTable = itemsData
      .map(item => {
        const orderQty = Math.max(0, item.parLevel - item.newCount)
        return `  ${item.productName}: ${item.newCount} on hand, par ${item.parLevel}, order ${orderQty}`
      })
      .join('\n')

    const emailBody = `
${submittedBy} submitted ${submissionType.toUpperCase()} counts at ${timestamp}

${itemsTable}

---
BSH Inventory System
    `.trim()

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY

    if (resendApiKey && managerEmails.length > 0) {
      // Send email via Resend
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'BSH Inventory <inventory@bshsocialhouse.com>',
          to: managerEmails,
          subject: `[BSH] ${submittedBy} submitted ${submissionType.toUpperCase()} counts`,
          text: emailBody,
        }),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('Resend error:', errorText)
        // Don't fail the request, just log the error
      } else {
        console.log('Email sent successfully to:', managerEmails)
      }
    } else {
      console.log('Email notification skipped - no API key or no managers')
      console.log('Would have sent to:', managerEmails)
      console.log('Email content:', emailBody)
    }

    // Update the count_submissions record to mark notification as sent
    const { error: updateError } = await supabase
      .from('count_submissions')
      .update({ notification_sent: true })
      .eq('submitted_by', (await supabase.auth.getUser()).data.user?.id)
      .order('submitted_at', { ascending: false })
      .limit(1)

    if (updateError) {
      console.error('Error updating submission record:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Notification processed',
      emailsSent: managerEmails.length,
    })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process notification' },
      { status: 500 }
    )
  }
}
