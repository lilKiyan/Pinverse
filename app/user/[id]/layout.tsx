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
        const user = await prisma.user.findUnique({
            where: { id },
            select: { name: true, username: true, bio: true, avatar: true },
        })

        if (!user) {
            return { title: 'کاربر' }
        }

        const title = `${user.name} (@${user.username})`
        const description = user.bio?.slice(0, 160) || `مشاهده پروفایل، پین‌ها و بردهای ${user.name} در شبکه اشتراک تصویر PInverse`

        return {
            title,
            description,
            alternates: {
                canonical: `${siteUrl}/user/${id}`,
            },
            openGraph: {
                title,
                description,
                url: `${siteUrl}/user/${id}`,
                siteName: 'PInverse',
                type: 'profile',
                images: user.avatar ? [{ url: user.avatar, alt: user.name }] : undefined,
            },
            twitter: {
                card: 'summary',
                title,
                description,
                images: user.avatar ? [user.avatar] : undefined,
            },
        }
    } catch {
        return { title: 'پروفایل کاربر' }
    }
}

export default async function UserProfileLayout({ children, params }: Props) {
    const { id } = await params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinverse.ir'
    let profileSchema = null

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { name: true, username: true, bio: true, avatar: true },
        })

        if (user) {
            profileSchema = {
                '@context': 'https://schema.org',
                '@type': 'ProfilePage',
                mainEntity: {
                    '@type': 'Person',
                    name: user.name,
                    alternateName: user.username,
                    description: user.bio || undefined,
                    image: user.avatar || undefined,
                    url: `${siteUrl}/user/${id}`,
                },
            }
        }
    } catch {
    }

    return (
        <>
            {profileSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
                />
            )}
            {children}
        </>
    )
}
