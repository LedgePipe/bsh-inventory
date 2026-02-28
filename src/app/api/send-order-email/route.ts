import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface OrderItem {
  id: string
  productName: string
  currentCount: number
  parLevel: number
  orderQty: number
  distributor?: string
}

function buildInventorySection(title: string, emoji: string, items: any[], isLiquor = false) {
  if (!items || items.length === 0) return ''

  const sorted = [...items].sort((a, b) => 
    (a.name || a.product_name || '').localeCompare(b.name || b.product_name || '')
  )

  const rows = sorted.map(item => {
    const name = item.name || item.product_name
    const count = item.current_count || 0
    const partial = item.partial_count || 0
    const total = count + partial
    const par = item.par_level || 0
    const status = par > 0 && total < par * 0.5 ? '🚨' : par > 0 && total < par * 0.75 ? '⚠️' : '✅'

    if (isLiquor) {
      return `<tr>
        <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${name}</td>
        <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px;">${count}</td>
        <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px;">${partial}</td>
        <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold; font-size: 13px;">${total % 1 === 0 ? total : total.toFixed(1)}</td>
        <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px;">${par}</td>
        <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px;">${status}</td>
      </tr>`
    }

    return `<tr>
      <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${name}</td>
      <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px;">${count}</td>
      <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px;">${par}</td>
      <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px;">${status}</td>
    </tr>`
  }).join('')

  const header = isLiquor
    ? `<tr style="background: #f1f5f9;">
        <th style="padding: 8px; text-align: left; font-size: 12px;">Item</th>
        <th style="padding: 8px; text-align: center; font-size: 12px;">Full</th>
        <th style="padding: 8px; text-align: center; font-size: 12px;">Partial</th>
        <th style="padding: 8px; text-align: center; font-size: 12px;">Total</th>
        <th style="padding: 8px; text-align: center; font-size: 12px;">Par</th>
        <th style="padding: 8px; text-align: center; font-size: 12px;">Status</th>
      </tr>`
    : `<tr style="background: #f1f5f9;">
        <th style="padding: 8px; text-align: left; font-size: 12px;">Item</th>
        <th style="padding: 8px; text-align: center; font-size: 12px;">Count</th>
        <th style="padding: 8px; text-align: center; font-size: 12px;">Par</th>
        <th style="padding: 8px; text-align: center; font-size: 12px;">Status</th>
      </tr>`

  return `
    <h3 style="color: #475569; margin-top: 20px; margin-bottom: 8px;">${emoji} ${title}</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>${header}</thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderType, distributorName, items, totalItems, generatedBy, orderId, pdfBase64 } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all registered users' emails
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, full_name')
      .not('email', 'is', null)

    const allRecipients = Array.from(new Set([
      'jamie@ledgepipe.com',
      ...(profiles?.map(p => p.email).filter(Boolean) || [])
    ]))

    // Build order section
    const itemsHtml = (items as OrderItem[])
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.currentCount}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.parLevel}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: #dc2626;">${item.orderQty}</td>
        </tr>
      `)
      .join('')

    // Pull full inventory for the snapshot section
    const [liquorRes, beerRes, wineRes, pepsiRes, glasswareRes] = await Promise.all([
      supabase.from('inventory_items').select('name, current_count, partial_count, par_level, category').order('name'),
      supabase.from('beer_items').select('product_name, current_count, par_level').order('product_name'),
      supabase.from('wine_items').select('product_name, current_count, par_level').order('product_name'),
      supabase.from('pepsi_items').select('product_name, current_count, par_level').order('product_name'),
      supabase.from('glassware_items').select('product_name, current_count, par_level').order('product_name'),
    ])

    const inventorySections = [
      buildInventorySection('Liquor', '🍾', liquorRes.data || [], true),
      buildInventorySection('Beer', '🍺', beerRes.data || []),
      buildInventorySection('Wine', '🍷', wineRes.data || []),
      buildInventorySection('Pepsi', '🥤', pepsiRes.data || []),
      buildInventorySection('Glassware', '🥃', glasswareRes.data || []),
    ].filter(Boolean).join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>BSH Order</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #475569, #334155); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0;">📦 BSH Order</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">${orderType.toUpperCase()}${distributorName ? ` - ${distributorName}` : ''}</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin: 0 0 10px 0;">
            <strong>Generated by:</strong> ${generatedBy}<br>
            <strong>Date:</strong> ${new Date().toLocaleString()}<br>
            <strong>Total Items:</strong> ${totalItems} units across ${items.length} products
          </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #475569; color: white;">
              <th style="padding: 12px; text-align: left;">Product</th>
              <th style="padding: 12px; text-align: center;">Current</th>
              <th style="padding: 12px; text-align: center;">Par</th>
              <th style="padding: 12px; text-align: center;">ORDER QTY</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="margin-top: 20px; padding: 15px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
          <strong>📋 Action Required:</strong> Please place this order with the supplier.
        </div>

        <hr style="margin: 40px 0; border: none; border-top: 2px solid #e2e8f0;">

        <div style="background: linear-gradient(135deg, #475569, #334155); color: white; padding: 15px 20px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0;">📸 Full Inventory Snapshot</h2>
          <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">${new Date().toLocaleString()}</p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 10px 20px 20px;">
          ${inventorySections || '<p style="color: #6b7280;">No inventory data available.</p>'}
        </div>

        <p style="margin-top: 30px; color: #6b7280; font-size: 12px; text-align: center;">Generated by BSH Inventory System</p>
      </body>
      </html>
    `

    const resendApiKey = process.env.RESEND_API_KEY
    const successfulRecipients: string[] = []

    if (resendApiKey) {
      for (const recipient of allRecipients) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'BSH Inventory <onboarding@resend.dev>',
              to: [recipient],
              subject: `📦 BSH Order: ${orderType.toUpperCase()}${distributorName ? ` - ${distributorName}` : ''} (${items.length} items)`,
              html: emailHtml,
            }),
          })

          if (emailResponse.ok) {
            successfulRecipients.push(recipient)
          } else {
            const err = await emailResponse.json()
            console.error(`Resend error for ${recipient}:`, JSON.stringify(err))
          }
        } catch (e) {
          console.error(`Resend exception for ${recipient}:`, e)
        }
      }
    }

    return NextResponse.json({
      success: true,
      recipients: successfulRecipients,
    })

  } catch (error: any) {
    console.error('Send order email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send order email' },
      { status: 500 }
    )
  }
}
