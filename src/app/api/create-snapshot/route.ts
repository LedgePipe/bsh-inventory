import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, notes } = body

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

    // 2. Pull current state from ALL inventory tables
    const snapshotItems: any[] = []

    // Liquor (inventory_items)
    const { data: liquorItems } = await supabaseAdmin
      .from('inventory_items')
      .select('id, name, current_count, partial_count, cost_per_unit')
    
    if (liquorItems) {
      for (const item of liquorItems) {
        snapshotItems.push({
          snapshot_id: snapshot.snapshot_id,
          item_id: item.id,
          full_count: item.current_count || 0,
          partial_count: item.partial_count || 0,
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

    return NextResponse.json({
      success: true,
      snapshot_id: snapshot.snapshot_id,
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
