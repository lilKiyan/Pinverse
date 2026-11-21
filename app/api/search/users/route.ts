import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import type { Prisma } from '@prisma/client'

// نرمال‌سازی متن فارسی (یکسان‌سازی حروف عربی و فارسی)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/ي/g, 'ی') // ي عربی → ی فارسی
    .replace(/ك/g, 'ک') // ك عربی → ک فارسی
    .replace(/\u200c/g, ' ') // نیم‌فاصله → فاصله
    .replace(/\s+/g, ' ') // چند فاصله پشت‌سرهم → یک فاصله
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    let q = searchParams.get('q')?.trim() || ''

    if (!q) {
      return NextResponse.json({ users: [] })
    }

    // اگه با @ شروع شده بود، حذفش کن (مثلاً @kiyan → kiyan)
    if (q.startsWith('@')) {
      q = q.slice(1)
    }

    const qNormalized = normalizeText(q)

    // جستجوی مستقیم در دیتابیس به جای لود تمام کاربران در رم سرور
    const searchConditions: Prisma.UserWhereInput[] = [
      { username: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
    ]

    if (qNormalized !== q.toLowerCase()) {
      searchConditions.push(
        { username: { contains: qNormalized, mode: 'insensitive' } },
        { name: { contains: qNormalized, mode: 'insensitive' } }
      )
    }

    const matchedUsers = await prisma.user.findMany({
      where: {
        AND: [
          currentUser ? { id: { not: currentUser.id } } : {},
          { OR: searchConditions },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        _count: {
          select: { following: true }, // تعداد دنبال‌کنندگان
        },
      },
      take: 20,
      orderBy: { username: 'asc' },
    })

    // بررسی وضعیت فالو فقط برای کاربران پیدا شده
    let followingIds = new Set<string>()
    if (currentUser && matchedUsers.length > 0) {
      const follows = await prisma.follow.findMany({
        where: {
          followerId: currentUser.id,
          followingId: { in: matchedUsers.map((u) => u.id) },
        },
        select: { followingId: true },
      })
      followingIds = new Set(follows.map((f) => f.followingId))
    }

    const result = matchedUsers.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      followersCount: u._count.following,
      isFollowing: followingIds.has(u.id),
    }))

    return NextResponse.json({ users: result })
  } catch (error) {
    console.error('GET /api/search/users error:', error)
    return NextResponse.json(
      { error: 'خطا در جستجوی کاربران', details: (error as Error).message },
      { status: 500 }
    )
  }
}