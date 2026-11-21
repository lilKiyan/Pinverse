import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

type Props = {
    children: React.ReactNode
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinverse.ir'

    try {
        const board = await prisma.board.findUnique({
            where: { id },
            select: { name: true, user: { select: { name: true } } },
        })

        if (!board) return { title: 'برد' }

        const title = `برد «${board.name}» | اثر ${board.user.name}`
        const description = `مشاهده و مرور تمام پین‌های ذخیره‌شده در برد ${board.name} در پلتفرم PInverse.`

        return {
            title,
            description,
            alternates: {
                canonical: `${siteUrl}/board/${id}`,
            },
            openGraph: {
                title,
                description,
                type: 'website',
            },
        }
    } catch {
        return { title: 'برد پین‌ها' }
    }
}

export default function BoardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
