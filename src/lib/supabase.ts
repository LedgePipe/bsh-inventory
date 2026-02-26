import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Using auth-helpers client to sync session to cookies for API routes
export const supabase = createClientComponentClient()
