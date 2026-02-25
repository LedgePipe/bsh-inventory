'use client'


import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getRandomQuote } from '@/lib/messages'
import { InventoryItem, InventoryItemInsert, InventoryItemWithUpdater, InventoryLogInsert, Profile } from '@/types/database'
import { toast } from 'sonner'
import LoginForm from '@/components/LoginForm'
import Header from '@/components/Header'
import StatsCards from '@/components/StatsCards'
import InventoryTable from '@/components/InventoryTable'
import AddItemModal from '@/components/AddItemModal'
import EditCountModal from '@/components/EditCountModal'
import UploadCSVModal from '@/components/UploadCSVModal'
import GenerateOrderModal from '@/components/inventory/GenerateOrderModal'
import LiquorPartialsTab from '@/components/LiquorPartialsTab'


interface LiquorOrderItem {
  id: string
  productName: string
  currentCount: number
  parLevel: number
  orderQty: number
}


interface PartialEdit {
  itemId: string
  partials: number[]  // Array of partial values
  itemName: string
}


type LiquorTabType = 'full' | 'partials'


export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
