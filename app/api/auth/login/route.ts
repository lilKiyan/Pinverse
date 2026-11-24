import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'
import { normalizeEmail } from '@/lib/validations'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { seedDatabase } from '@/lib/bootstrap'

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
        const rawIdentifier = body.identifier ?? body.email
        const { password } = body

        if (!rawIdentifier || !password) {
            return NextResponse.json(
                { error: 'ایمیل یا نام کاربری و رمز عبور الزامی است' },
                { status: 400 }
            )
        }

        const normalizedIdentifier = normalizeEmail(String(rawIdentifier))

        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: { equals: normalizedIdentifier, mode: 'insensitive' } },
                    { username: { equals: normalizedIdentifier, mode: 'insensitive' } },
                ],
            },
        })

        // در دیتابیس کاملاً تازه (بدون هیچ کاربری)، هنگام ورود با admin راه‌اندازی اولیه به‌صورت خودکار انجام می‌شود
        if (
            !user &&
            (normalizedIdentifier === 'admin' || normalizedIdentifier === 'admin@pinverse.ir')
        ) {
            const totalUsers = await prisma.user.count()
            if (totalUsers === 0) {
                await seedDatabase(prisma)
                user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: { equals: normalizedIdentifier, mode: 'insensitive' } },
                            { username: { equals: normalizedIdentifier, mode: 'insensitive' } },
                        ],
                    },
                })
            }
        }

        if (!user) {
            return NextResponse.json(
                { error: 'ایمیل/نام کاربری یا رمز عبور اشتباه است' },
                { status: 401 }
            )
        }

        const isPasswordValid = await comparePassword(password, user.password)
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'ایمیل/نام کاربری یا رمز عبور اشتباه است' },
                { status: 401 }
            )
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