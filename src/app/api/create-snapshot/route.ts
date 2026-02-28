import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null
    let notes: string | null = null

    try {
      const body = await request.json()
      userId = body.userId || null
      notes = body.notes || null
    } catch {
      // No body is fine
    }

    // 1. Create the snapshot record
    const { data: snapshot, error: snapError } = await supabaseAdmin
      .from('count_snapshots')
      .insert({
        created_by: userId,
        notes: notes || `Inventory snapshot - ${new Date().toLocaleDateString()}`,
        status: 'completed'
      })
      .select()
      .single()

    if (snapError) throw snapError

    const snapshotId = snapshot.snapshot_id || snapshot.id

    // 2. Pull current state from ALL inventory tables
    const snapshotItems: any[] = []

    // Liquor (inventory_items)
    const { data: liquorItems } = await supabaseAdmin
      .from('inventory_items')
      .select('id, name, current_count, partial_count, par_level, cost_per_unit, category')

    if (liquorItems) {
      for (const item of liquorItems) {
        snapshotItems.push({
          snapshot_id: snapshotId,
          item_id: item.id,
          full_count: item.current_count || 0,
          partial_count: item.partial_count || 0,
        })
      }
    }

    // Beer
    const { data: beerItems } = await supabaseAdmin
      .from('beer_items')
      .select('id, product_name, current_count, par_level')

    if (beerItems) {
      for (const item of beerItems) {
        snapshotItems.push({
          snapshot_id: snapshotId,
          item_id: item.id,
          full_count: item.current_count || 0,
          partial_count: 0,
        })
      }
    }

    // Wine
    const { data: wineItems } = await supabaseAdmin
      .from('wine_items')
      .select('id, product_name, current_count, par_level')

    if (wineItems) {
      for (const item of wineItems) {
        snapshotItems.push({
          snapshot_id: snapshotId,
          item_id: item.id,
          full_count: item.current_count || 0,
          partial_count: 0,
        })
      }
    }

    // Pepsi
    const { data: pepsiItems } = await supabaseAdmin
      .from('pepsi_items')
      .select('id, product_name, current_count, par_level')

    if (pepsiItems) {
      for (const item of pepsiItems) {
        snapshotItems.push({
          snapshot_id: snapshotId,
          item_id: item.id,
          full_count: item.current_count || 0,
          partial_count: 0,
        })
      }
    }

    // Glassware
    const { data: glasswareItems } = await supabaseAdmin
      .from('glassware_items')
      .select('id, product_name, current_count, par_level')

    if (glasswareItems) {
      for (const item of glasswareItems) {
        snapshotItems.push({
          snapshot_id: snapshotId,
          item_id: item.id,
          full_count: item.current_count || 0,
          partial_count: 0,
        })
      }
    }

    // 3. Insert all snapshot items
    if (snapshotItems.length > 0) {
      const { error: itemsError } = await supabaseAdmin
        .from('snapshot_items')
        .insert(snapshotItems)

      if (itemsError) throw itemsError
    }

    // 4. Build full inventory summary and email it
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      const sections: string[] = []

      if (liquorItems && liquorItems.length > 0) {
        const rows = liquorItems
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(item => {
            const total = (item.current_count || 0) + (item.partial_count || 0)
            const status = item.par_level > 0 && total < item.par_level * 0.5 ? '🚨' : total < item.par_level * 0.75 ? '⚠️' : '✅'
            return `<tr>
              <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
              <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.current_count}</td>
              <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.partial_count || 0}</td>
              <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${total.toFixed(1)}</td>
              <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.par_level}</td>
              <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${status}</td>
            </tr>`
          }).join('')

        sections.push(`
          <h2 style="color: #475569; margin-top: 30px;">🍾 Liquor</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background: #f1f5f9;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Full</th>
              <th style="padding: 8px; text-align: center;">Partial</th>
              <th style="padding: 8px; text-align: center;">Total</th>
              <th style="padding: 8px; text-align: center;">Par</th>
              <th style="padding: 8px; text-align: center;">Status</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        `)
      }

      const simpleSection = (title: string, emoji: string, data: any[] | null) => {
        if (!data || data.length === 0) return
        const rows = data
          .sort((a, b) => a.product_name.localeCompare(b.product_name))
          .map(item => {
            const status = item.par_level > 0 && item.current_count < item.par_level * 0.5 ? '🚨' : item.current_count < item.par_level * 0.75 ? '⚠️' : '✅'
            return `<tr>
              <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
              <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.current_count}</td>
              <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.par_level}</td>
              <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${status}</td>
            </tr>`
          }).join('')

        sections.push(`
          <h2 style="color: #475569; margin-top: 30px;">${emoji} ${title}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background: #f1f5f9;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Count</th>
              <th style="padding: 8px; text-align: center;">Par</th>
              <th style="padding: 8px; text-align: center;">Status</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        `)
      }

      simpleSection('Beer', '🍺', beerItems)
      simpleSection('Wine', '🍷', wineItems)
      simpleSection('Pepsi', '🥤', pepsiItems)
      simpleSection('Glassware', '🥃', glasswareItems)

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>BSH Inventory Snapshot</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #475569, #334155); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0;">📸 BSH Inventory Snapshot</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div style="background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-top: none;">
            <strong>${snapshotItems.length} items captured</strong> across all categories
          </div>
          ${sections.join('')}
          <p style="margin-top: 30px; color: #6b7280; font-size: 12px; text-align: center;">Generated by BSH Inventory System</p>
        </body>
        </html>
      `

      // Send to Jamie
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'BSH Inventory <onboarding@resend.dev>',
            to: ['jamie@ledgepipe.com'],
            subject: `📸 BSH Inventory Snapshot - ${new Date().toLocaleDateString()}`,
            html: emailHtml,
          }),
        })
      } catch (e) {
        console.error('Snapshot email failed:', e)
      }
    }

    return NextResponse.json({
      success: true,
      snapshot_id: snapshotId,
      items_captured: snapshotItems.length,
      created_at: snapshot.created_at,
    })

  } catch (error: any) {
    console.error('Snapshot error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
