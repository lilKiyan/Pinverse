import { prisma } from './prisma'

export const NOTIFICATION_TYPES = ['like', 'comment', 'follow', 'save', 'message'] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

const MESSAGES: Record<NotificationType, (pinTitle: string) => string> = {
    like: (t) => `به پین «${t}» لایک داد`,
    comment: (t) => `روی پین «${t}» دیدگاه گذاشت`,
    follow: () => `شما را دنبال کرد`,
    save: (t) => `پین «${t}» را در بردش ذخیره کرد`,
    message: () => `پیامی برای شما فرستاد`,
}

function shortTitle(title?: string | null): string {
    if (!title) return ''
    return title.length > 30 ? title.slice(0, 30) + '…' : title
}

type NotificationKey = {
    type: NotificationType
    recipientId: string
    actorId: string
    pinId?: string | null
}

export async function createNotification(
    input: NotificationKey & { pinTitle?: string | null }
): Promise<void> {
    try {
        if (input.recipientId === input.actorId) return

        const existing = await prisma.notification.findFirst({
            where: {
                userId: input.recipientId,
                actorId: input.actorId,
                type: input.type,
                pinId: input.pinId ?? null,
                isRead: false,
            },
            select: { id: true },
        })

        if (existing) {
            await prisma.notification.update({
                where: { id: existing.id },
                data: { createdAt: new Date() },
            })
            return
        }

        const message = MESSAGES[input.type](shortTitle(input.pinTitle))

        await prisma.$transaction([
            prisma.notification.create({
                data: {
                    type: input.type,
                    message,
                    userId: input.recipientId,
                    actorId: input.actorId,
                    pinId: input.pinId ?? null,
                },
            }),
            prisma.user.update({
                where: { id: input.recipientId },
                data: { unreadNotifications: { increment: 1 } },
            }),
        ])
    } catch (error) {
        console.error('createNotification error:', error)
    }
}

export async function removeNotification(input: NotificationKey): Promise<void> {
    try {
        const deleted = await prisma.notification.deleteMany({
            where: {
                userId: input.recipientId,
                actorId: input.actorId,
                type: input.type,
                pinId: input.pinId ?? null,
                isRead: false,
            },
        })

        if (deleted.count > 0) {
            await prisma.user.update({
                where: { id: input.recipientId },
                data: { unreadNotifications: { decrement: deleted.count } },
            })
        }
    } catch (error) {
        console.error('removeNotification error:', error)
    }
}