import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, COOKIE_NAME, hashPassword, comparePassword, signToken } from '@/lib/auth'
import { validatePassword } from '@/lib/validations'
import { cookies } from 'next/headers'

export async function PATCH(request: Request) {
    try {
        const authUser = await getCurrentUser()

        if (!authUser) {
            return NextResponse.json(
                { error: 'برای ویرایش پروفایل وارد شوید' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'کاربر یافت نشد' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const {
            name,
            username,
            email,
            bio,
            avatar,
            oldPassword,
            newPassword,
        } = body

        if (email && email !== user.email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } })
            if (existingEmail) {
                return NextResponse.json(
                    { error: 'این ایمیل قبلاً استفاده شده است' },
                    { status: 409 }
                )
            }
        }

        if (username && username !== user.username) {
            const existingUsername = await prisma.user.findUnique({ where: { username } })
            if (existingUsername) {
                return NextResponse.json(
                    { error: 'این نام کاربری قبلاً استفاده شده است' },
                    { status: 409 }
                )
            }
        }

        let newPasswordHash: string | undefined
        if (oldPassword || newPassword) {
            if (!oldPassword || !newPassword) {
                return NextResponse.json(
                    { error: 'برای تغییر رمز عبور، رمز فعلی و رمز جدید را وارد کنید' },
                    { status: 400 }
                )
            }

            const isPasswordValid = await comparePassword(oldPassword, user.password)
            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: 'رمز عبور فعلی اشتباه است' },
                    { status: 400 }
                )
            }

            const passwordErr = validatePassword(newPassword)
            if (passwordErr) {
                return NextResponse.json(
                    { error: passwordErr },
                    { status: 400 }
                )
            }

            newPasswordHash = await hashPassword(newPassword)
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: name ?? user.name,
                username: username ?? user.username,
                email: email ?? user.email,
                bio: bio !== undefined ? bio : user.bio,
                avatar: avatar !== undefined ? avatar : user.avatar,
                ...(newPasswordHash ? { password: newPasswordHash } : {}),
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                avatar: true,
                bio: true,
            },
        })

        if (newPasswordHash) {
            const token = await signToken(user.id)
            const cookieStore = await cookies()
            cookieStore.set(COOKIE_NAME, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
                sameSite: 'lax',
            })
        }

        return NextResponse.json({ user: updatedUser })
    } catch (error) {
        console.error('PATCH /api/user error:', error)
        return NextResponse.json(
            { error: 'خطا در ویرایش پروفایل' },
            { status: 500 }
        )
    }
}

export async function DELETE() {
    try {
        const authUser = await getCurrentUser()
        if (!authUser) {
            return NextResponse.json(
                { error: 'برای حذف حساب وارد شوید' },
                { status: 401 }
            )
        }

        const userId = authUser.id

        await prisma.$transaction(async (tx) => {
            await tx.message.deleteMany({ where: { senderId: userId } })

            const userConversations = await tx.conversation.findMany({
                where: { participants: { some: { userId } } },
                select: { id: true },
            })
            const convIds = userConversations.map((c) => c.id)

            if (convIds.length > 0) {
                await tx.message.deleteMany({ where: { conversationId: { in: convIds } } })
                await tx.conversationParticipant.deleteMany({ where: { conversationId: { in: convIds } } })
                await tx.conversation.deleteMany({ where: { id: { in: convIds } } })
            }

            await tx.comment.deleteMany({ where: { userId } })

            await tx.like.deleteMany({ where: { userId } })

            await tx.save.deleteMany({ where: { userId } })

            await tx.follow.deleteMany({
                where: { OR: [{ followerId: userId }, { followingId: userId }] },
            })

            const userPins = await tx.pin.findMany({
                where: { userId },
                select: { id: true },
            })
            const pinIds = userPins.map((p) => p.id)

            if (pinIds.length > 0) {
                await tx.comment.deleteMany({ where: { pinId: { in: pinIds } } })
                await tx.like.deleteMany({ where: { pinId: { in: pinIds } } })
                await tx.save.deleteMany({ where: { pinId: { in: pinIds } } })
                await tx.pin.deleteMany({ where: { userId } })
            }

            await tx.board.deleteMany({ where: { userId } })

            await tx.user.delete({ where: { id: userId } })
        })

        const cookieStore = await cookies()
        cookieStore.delete(COOKIE_NAME)

        return NextResponse.json({ success: true, message: 'حساب کاربری با موفقیت حذف شد' })
    } catch (error) {
        console.error('DELETE /api/user error:', error)
        return NextResponse.json(
            { error: 'خطا در حذف حساب کاربری' },
            { status: 500 }
        )
    }
}