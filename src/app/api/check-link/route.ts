import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, bookmark_id } = await request.json()
  if (!url || !bookmark_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  let is_broken = false
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' })
    is_broken = res.status === 404 || res.status === 410 || res.status >= 500
  } catch {
    is_broken = true
  }

  await supabase
    .from('bookmarks')
    .update({ is_broken, last_checked_at: new Date().toISOString() })
    .eq('id', bookmark_id)
    .eq('user_id', user.id)

  return NextResponse.json({ is_broken })
}
