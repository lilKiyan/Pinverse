import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { hashPassword } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { moderateText } from '@/lib/moderation'
import {
    validateName,
    validateUsername,
    validatePassword,
    normalizeUsername,
} from '@/lib/validations'

async function guardTarget(
    admin: { id: string },
    targetId: string,
    options?: { allowAdminTarget?: boolean }
): Promise<
    | { target: { id: string; banned: boolean; isAdmin: boolean } }
    | NextResponse
> {
    if (targetId === admin.id) {
        return NextResponse.json(
            { error: 'نمی‌توانید حساب خودتان را مدیریت کنید' },
            { status: 400 }
        )
    }

    const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: {
            id: true,
            banned: true,
            roles: { select: { role: { select: { name: true } } } },
        },
    })

    if (!target) {
        return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    const isAdmin = target.roles.some((r) => r.role.name === 'admin')

    if (isAdmin && !options?.allowAdminTarget) {
        return NextResponse.json(
            { error: 'ادمین‌ها از طریق ویرایش مستقیم قابل تغییر نیستند' },
            { status: 403 }
        )
    }

    return {
        target: {
            id: target.id,
            banned: target.banned,
            isAdmin,  
        },
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin('users.edit')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const rl = rateLimit(getClientIp(request), { limit: 30, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'کمی آرام‌تر!' }, { status: 429 })
        }

        const { id } = await params

        const guard = await guardTarget(admin, id)
        if (guard instanceof NextResponse) return guard

        const body = await request.json()
        const { name, username, bio, avatar, newPassword } = body as {
            name?: string
            username?: string
            bio?: string
            avatar?: string
            newPassword?: string
        }

        const data: {
            name?: string
            username?: string
            bio?: string
            avatar?: string
            password?: string
        } = {}

        if (name !== undefined) {
            const nameError = validateName(name)
            if (nameError) {
                return NextResponse.json({ error: nameError, field: 'name' }, { status: 400 })
            }
            data.name = name.trim()
        }

        if (username !== undefined) {
            const usernameError = validateUsername(username)
            if (usernameError) {
                return NextResponse.json({ error: usernameError, field: 'username' }, { status: 400 })
            }

            const normalized = normalizeUsername(username)

            const taken = await prisma.user.findFirst({
                where: {
                    username: { equals: normalized, mode: 'insensitive' },
                    id: { not: id },
                },
                select: { id: true },
            })
            if (taken) {
                return NextResponse.json(
                    { error: 'این نام کاربری قبلاً استفاده شده است', field: 'username' },
                    { status: 409 }
                )
            }

            data.username = normalized
        }

        if (bio !== undefined) {
            const moderation = moderateText(bio)
            if (!moderation.ok) {
                return NextResponse.json({ error: moderation.reason }, { status: 400 })
            }
            data.bio = bio.trim()
        }

        if (avatar !== undefined) {
            data.avatar = avatar
        }

        if (newPassword !== undefined && newPassword !== '') {
            const passwordError = validatePassword(newPassword)
            if (passwordError) {
                return NextResponse.json({ error: passwordError, field: 'newPassword' }, { status: 400 })
            }
            data.password = await hashPassword(newPassword)
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'چیزی برای تغییر ارسال نشده' }, { status: 400 })
        }

        const updated = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                bio: true,
                banned: true,
            },
        })

        return NextResponse.json({ user: updated, message: 'کاربر به‌روزرسانی شد' })
    } catch (error) {
        console.error('PATCH /api/admin/users/[id] error:', error)
        return NextResponse.json({ error: 'خطا در ویرایش کاربر' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin('users.delete')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const rl = rateLimit(getClientIp(request), { limit: 5, windowMs: 300_000 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'کمی آرام‌تر!' }, { status: 429 })
        }

        const { id } = await params

        const guard = await guardTarget(admin, id, { allowAdminTarget: true })
        if (guard instanceof NextResponse) return guard

        const demoUserId = process.env.DEMO_USER_ID
        if (demoUserId && id === demoUserId) {
            return NextResponse.json(
                { error: 'این حساب دموی سایت است و حذف نمی‌شود' },
                { status: 403 }
            )
        }

        const [userPins, userBoards, userConversations] = await Promise.all([
            prisma.pin.findMany({
                where: { userId: id },
                select: { id: true },
            }),
            prisma.board.findMany({
                where: { userId: id },
                select: { id: true },
            }),
            prisma.conversation.findMany({
                where: { participants: { some: { userId: id } } },
                select: { id: true },
            }),
        ])

        const pinIds = userPins.map((p) => p.id)
        const boardIds = userBoards.map((b) => b.id)
        const convIds = userConversations.map((c) => c.id)

        await prisma.$transaction(
            async (tx) => {
                if (pinIds.length > 0) {
                    await tx.message.updateMany({
                        where: { pinId: { in: pinIds } },
                        data: { pinId: null },
                    })
                }

                await tx.notification.deleteMany({
                    where: {
                        OR: [
                            ...(pinIds.length > 0 ? [{ pinId: { in: pinIds } }] : []),
                            { userId: id },
                            { actorId: id },
                        ],
                    },
                })

                await tx.report.deleteMany({
                    where: {
                        OR: [
                            ...(pinIds.length > 0 ? [{ pinId: { in: pinIds } }] : []),
                            { reporterId: id },
                        ],
                    },
                })

                await tx.like.deleteMany({
                    where: {
                        OR: [
                            ...(pinIds.length > 0 ? [{ pinId: { in: pinIds } }] : []),
                            { userId: id },
                        ],
                    },
                })

                await tx.comment.deleteMany({
                    where: {
                        OR: [
                            ...(pinIds.length > 0 ? [{ pinId: { in: pinIds } }] : []),
                            { userId: id },
                        ],
                    },
                })

                await tx.save.deleteMany({
                    where: {
                        OR: [
                            ...(pinIds.length > 0 ? [{ pinId: { in: pinIds } }] : []),
                            ...(boardIds.length > 0 ? [{ boardId: { in: boardIds } }] : []),
                            { userId: id },
                        ],
                    },
                })

                if (boardIds.length > 0) {
                    await tx.pin.updateMany({
                        where: { boardId: { in: boardIds } },
                        data: { boardId: null },
                    })
                }

                await tx.pin.deleteMany({ where: { userId: id } })

                await tx.board.deleteMany({ where: { userId: id } })

                await tx.follow.deleteMany({
                    where: { OR: [{ followerId: id }, { followingId: id }] },
                })

                if (convIds.length > 0) {
                    await tx.message.deleteMany({ where: { conversationId: { in: convIds } } })
                    await tx.conversationParticipant.deleteMany({ where: { conversationId: { in: convIds } } })
                    await tx.conversation.deleteMany({ where: { id: { in: convIds } } })
                }
                await tx.message.deleteMany({ where: { senderId: id } })
                await tx.conversationParticipant.deleteMany({ where: { userId: id } })

                await tx.userRole.deleteMany({ where: { userId: id } })

                await tx.user.delete({ where: { id } })
            },
            {
                maxWait: 15000,
                timeout: 60000,
            }
        )

        return NextResponse.json({ message: 'کاربر و همه‌ی داده‌های او با موفقیت حذف شد' })
    } catch (error) {
        console.error('DELETE /api/admin/users/[id] error:', error)
        return NextResponse.json({ error: 'خطا در حذف کاربر: ' + ((error as Error)?.message || '') }, { status: 500 })
    }
}