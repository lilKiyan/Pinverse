import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'
import { normalizeEmail } from '@/lib/validations'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request: Request) {
    try {
        const rl = rateLimit(getClientIp(request), { limit: 5, windowMs: 300_000 })
        if (!rl.ok) {
            return NextResponse.json(
                { error: `کمی آرام‌تر! ${rl.retryAfter} ثانیه دیگر تلاش کنید` },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
            )
        }

        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'ایمیل و رمز عبور الزامی است' }, { status: 400 })
        }

        const normalizedEmail = normalizeEmail(email)

        const user = await prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        })

        if (!user) {
            return NextResponse.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 })
        }

        const isPasswordValid = await comparePassword(password, user.password)
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 })
        }

        if (user.banned) {
            return NextResponse.json(
                { error: 'حساب کاربری شما مسدود شده است. لطفاً با پشتیبانی تماس بگیرید.' },
                { status: 403 }
            )
        }

        const token = await signToken(user.id)

        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'lax',
        })

        return NextResponse.json({
            user: { id: user.id, email: user.email, username: user.username, name: user.name },
        })
    } catch (error) {
        console.error('POST /api/auth/login error:', error)
        return NextResponse.json({ error: 'خطا در ورود' }, { status: 500 })
    }
}