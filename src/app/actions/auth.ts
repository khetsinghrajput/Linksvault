'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  full_name: z.string().min(1).optional(),
})

export async function login(_state: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Invalid email or password format.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/app/all')
}

export async function signup(_state: unknown, formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
    },
  })

  if (error) {
    const msg = error.message.toLowerCase().includes('rate limit')
      ? 'Supabase email limit reached for this project. Disable email confirmation in your Supabase Auth settings to continue testing.'
      : error.message
    return { error: msg }
  }

  // When email confirmation is disabled in Supabase, signUp returns a live session immediately
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/app/all')
  }

  return { success: true as const, email: parsed.data.email }
}

export async function resetPassword(_state: unknown, formData: FormData) {
  const email = formData.get('email')?.toString()
  if (!email) return { error: 'Email is required.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email for a reset link.' }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
