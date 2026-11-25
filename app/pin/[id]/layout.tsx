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
        const pin = await prisma.pin.findUnique({
            where: { id },
            select: {
                title: true,
                description: true,
                imageUrl: true,
                imageWidth: true,
                imageHeight: true,
                user: { select: { name: true, username: true } },
                category: { select: { name: true } },
            },
        })

        if (!pin) {
            return {
                title: 'پین یافت نشد',
            }
        }

        const title = `${pin.title} | اثر ${pin.user.name}`
        const description =
            pin.description?.slice(0, 160) ||
            `مشاهده تصویر و ایده «${pin.title}» در دسته‌بندی ${pin.category?.name || 'تصاویر'} در PInverse`

        return {
            title,
            description,
            alternates: {
                canonical: `${siteUrl}/pin/${id}`,
            },
            openGraph: {
                title,
                description,
                url: `${siteUrl}/pin/${id}`,
                siteName: 'PInverse',
                type: 'article',
                images: [
                    {
                        url: pin.imageUrl,
                        width: pin.imageWidth || 800,
                        height: pin.imageHeight || 1200,
                        alt: pin.title,
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [pin.imageUrl],
            },
        }
    } catch {
        return {
            title: 'مشاهده پین',
        }
    }
}

export default async function PinDetailLayout({ children, params }: Props) {
    const { id } = await params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinverse.ir'
    let imageSchema = null

    try {
        const pin = await prisma.pin.findUnique({
            where: { id },
            select: {
                title: true,
                description: true,
                imageUrl: true,
                imageWidth: true,
                imageHeight: true,
                createdAt: true,
                user: { select: { name: true, username: true } },
                category: { select: { name: true } },
            },
        })

        if (pin) {
            imageSchema = {
                '@context': 'https://schema.org',
                '@type': 'ImageObject',
                name: pin.title,
                description: pin.description || pin.title,
                contentUrl: pin.imageUrl,
                thumbnailUrl: pin.imageUrl,
                width: pin.imageWidth || 800,
                height: pin.imageHeight || 1200,
                datePublished: pin.createdAt.toISOString(),
                author: {
                    '@type': 'Person',
                    name: pin.user.name,
                },
                creator: {
                    '@type': 'Person',
                    name: pin.user.name,
                },
                publisher: {
                    '@type': 'Organization',
                    name: 'PInverse',
                    logo: {
                        '@type': 'ImageObject',
                        url: `${siteUrl}/icons/icon-512.png`,
                    },
                },
            }
        }
    } catch {
    }

    return (
        <>
            {imageSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(imageSchema) }}
                />
            )}
            {children}
        </>
    )
}
