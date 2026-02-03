import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zwypodzchumtuitkhkta.supabase.co'
const supabaseAnonKey = 'sb_publishable_Yeo_ij8JWe7fVfqUw3VIfA_lvb5DO3t'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)