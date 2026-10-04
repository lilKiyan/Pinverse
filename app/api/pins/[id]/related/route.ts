import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import type { Prisma } from '@prisma/client'

type RelatedPin = Prisma.PinGetPayload<{
    include: {
        saves: { include: { board: true } };
        category: { select: { slug: true; name: true; icon: true; color: true } };
        reports: { select: { reporterId: true } };
    };
}>

const emptyRelatedPins: RelatedPin[] = []

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        const cacheControl = user
            ? 'private, no-store'
            : 'public, max-age=60, stale-while-revalidate=120'

        const currentPin = await prisma.pin.findUnique({
            where: { id },
            select: {
                title: true,
                userId: true,
                categoryId: true,
            },
        })

        if (!currentPin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        const keywords = currentPin.title
            .split(/[\s،,._\-()!؟?]+/)
            .filter((w) => w.length >= 3)
            .slice(0, 3)

        const [categoryPins, creatorPins] = await Promise.all([
            currentPin.categoryId
                ? prisma.pin.findMany({
                    where: {
                        id: { not: id },
                        categoryId: currentPin.categoryId,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 12,
                    include: {
                        saves: { include: { board: true } },
                        category: { select: { slug: true, name: true, icon: true, color: true } },
                        reports: { select: { reporterId: true } },
                    },
                })
                : emptyRelatedPins,

            prisma.pin.findMany({
                where: {
                    id: { not: id },
                    userId: currentPin.userId,
                },
                orderBy: { createdAt: 'desc' },
                take: 12,
                include: {
                    saves: { include: { board: true } },
                    category: { select: { slug: true, name: true, icon: true, color: true } },
                    reports: { select: { reporterId: true } },
                },
            }),
        ])

        const seen = new Set<string>([id])
        const merged: RelatedPin[] = []

        for (const pin of categoryPins) {
            if (!seen.has(pin.id)) {
                seen.add(pin.id)
                merged.push(pin)
            }
        }

        for (const pin of creatorPins) {
            if (!seen.has(pin.id)) {
                seen.add(pin.id)
                merged.push(pin)
            }
        }

        const related: RelatedPin[] = merged.slice(0, 20)

        const pinsWithMeta = related.map((pin) => {
            const userSaves = user
                ? pin.saves.filter((s) => s.userId === user.id)
                : []

            return {
                id: pin.id,
                title: pin.title,
                description: pin.description,
                imageUrl: pin.imageUrl,
                imageWidth: pin.imageWidth,
                imageHeight: pin.imageHeight,
                createdAt: pin.createdAt,
                updatedAt: pin.updatedAt,
                userId: pin.userId,
                isOwner: user ? pin.userId === user.id : false,
                isSavedByMe: userSaves.length > 0,
                isReportedByMe: user
                    ? pin.reports.some((r) => r.reporterId === user.id)
                    : false,
                category: pin.category
                    ? {
                        slug: pin.category.slug,
                        name: pin.category.name,
                        icon: pin.category.icon,
                        color: pin.category.color,
                    }
                    : null,
                savedBoards: userSaves.map((s) => ({
                    boardId: s.boardId,
                    boardName: s.board?.name || null,
                })),
            }
        })

        return NextResponse.json(
            { pins: pinsWithMeta },
            { headers: { 'Cache-Control': cacheControl } }
        )
    } catch (error) {
        console.error('GET /api/pins/[id]/related error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین‌های مرتبط' },
            { status: 500 }
        )
    }
}