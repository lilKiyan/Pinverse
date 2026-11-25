import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json([])
        }

        const boards = await prisma.board.findMany({
            where: { userId: user.id },
            include: {
                saves: {
                    include: { pin: true },
                    orderBy: { createdAt: 'desc' },
                    take: 4,
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        const boardsWithPins = boards.map((board) => ({
            ...board,
            pins: board.saves.map((s) => s.pin),
            saves: undefined,
        }))

        return NextResponse.json(boardsWithPins)
    } catch (error) {
        console.error('GET /api/boards error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت بردها' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ساخت برد باید وارد شوید' },
                { status: 401 }
            )
        }

        const body = await request.json()

        if (!body.name) {
            return NextResponse.json(
                { error: 'نام برد الزامی است' },
                { status: 400 }
            )
        }

        const newBoard = await prisma.board.create({
            data: {
                name: body.name,
                userId: user.id,
                isPrivate: body.isPrivate || false,
            },
        })

        return NextResponse.json(newBoard, { status: 201 })
    } catch (error) {
        console.error('POST /api/boards error:', error)
        return NextResponse.json(
            { error: 'خطا در ساخت برد' },
            { status: 500 }
        )
    }
}