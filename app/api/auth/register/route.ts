import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

import {
    validateEmail,
    validateUsername,
    validateName,
    validatePassword,
    normalizeUsername,
    normalizeEmail,
} from '@/lib/validations'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request: Request) {
    try {

        const rl = rateLimit(getClientIp(request), { limit: 3, windowMs: 600_000 })
        if (!rl.ok) {
            return NextResponse.json(
                { error: `کمی آرام‌تر! ${rl.retryAfter} ثانیه دیگر تلاش کنید` },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
            )
        }

        const body = await request.json()
        const { email, username, name, password } = body

        const emailError = validateEmail(email)
        if (emailError) return NextResponse.json({ error: emailError, field: 'email' }, { status: 400 })

        const usernameError = validateUsername(username)
        if (usernameError) return NextResponse.json({ error: usernameError, field: 'username' }, { status: 400 })

        const nameError = validateName(name)
        if (nameError) return NextResponse.json({ error: nameError, field: 'name' }, { status: 400 })

        const passwordError = validatePassword(password)
        if (passwordError) return NextResponse.json({ error: passwordError, field: 'password' }, { status: 400 })

        const normalizedEmail = normalizeEmail(email)
        const normalizedUsername = normalizeUsername(username)

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: { equals: normalizedEmail, mode: 'insensitive' } },
                    { username: { equals: normalizedUsername, mode: 'insensitive' } },
                ],
            },
            select: { email: true, username: true },
        })

        if (existingUser) {
            const isEmailTaken = existingUser.email.toLowerCase() === normalizedEmail
            return NextResponse.json(
                {
                    error: isEmailTaken
                        ? 'این ایمیل قبلاً ثبت شده است'
                        : 'این نام کاربری قبلاً استفاده شده است',
                    field: isEmailTaken ? 'email' : 'username',
                },
                { status: 409 }
            )
        }

        const hashedPassword = await hashPassword(password)

        const newUser = await prisma.user.create({
            data: {
                email: normalizedEmail,
                username: normalizedUsername,
                name: name.trim(),
                password: hashedPassword,
            },
        })

        const token = await signToken(newUser.id)
        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'lax',
        })

        return NextResponse.json(
            {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    username: newUser.username,
                    name: newUser.name,
                },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('POST /api/auth/register error:', error)
        return NextResponse.json({ error: 'خطا در ثبت‌نام' }, { status: 500 })
    }
}