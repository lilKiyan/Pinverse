
import {
    LuPalette, LuUtensils, LuPlane, LuMonitor, LuShirt,
    LuDumbbell, LuSprout, LuCamera, LuLightbulb, LuMusic, LuTag, LuSofa, LuPizza, LuGuitar,LuDog
} from 'react-icons/lu'
import type { IconType } from 'react-icons'

export const ICON_REGISTRY: Record<string, IconType> = {
    art: LuPalette,
    cooking: LuUtensils,
    travel: LuPlane,
    technology: LuMonitor,
    fashion: LuShirt,
    sports: LuDumbbell,
    home: LuTag,
    garden: LuSprout,
    photography: LuCamera,
    ideas: LuLightbulb,
    music: LuMusic,
    other: LuTag,
    sofa: LuSofa,
    pizza: LuPizza,
    guitar: LuGuitar,
    animal:LuDog
}

export type CategoryMeta = {
    slug: string
    name: string
    icon: string
    iconComponent: IconType
    color: string
}

export const CATEGORIES: CategoryMeta[] = [
    { slug: 'art', name: 'هنر و طراحی', icon: 'art', iconComponent: ICON_REGISTRY['art'], color: '#8b5cf6' },
    { slug: 'cooking', name: 'آشپزی', icon: 'cooking', iconComponent: ICON_REGISTRY['cooking'], color: '#f59e0b' },
    { slug: 'travel', name: 'سفر و مکان‌ها', icon: 'travel', iconComponent: ICON_REGISTRY['travel'], color: '#0ea5e9' },
    { slug: 'technology', name: 'تکنولوژی', icon: 'technology', iconComponent: ICON_REGISTRY['technology'], color: '#3b82f6' },
    { slug: 'fashion', name: 'مد و استایل', icon: 'fashion', iconComponent: ICON_REGISTRY['fashion'], color: '#ec4899' },
    { slug: 'sports', name: 'ورزش و تناسب', icon: 'sports', iconComponent: ICON_REGISTRY['sports'], color: '#22c55e' },
    { slug: 'home', name: 'خانه و دکور', icon: 'home', iconComponent: ICON_REGISTRY['home'], color: '#a855f7' },
    { slug: 'garden', name: 'گیاهان و باغبانی', icon: 'garden', iconComponent: ICON_REGISTRY['garden'], color: '#10b981' },
    { slug: 'photography', name: 'عکاسی', icon: 'photography', iconComponent: ICON_REGISTRY['photography'], color: '#64748b' },
    { slug: 'ideas', name: 'ایده‌های خلاقانه', icon: 'ideas', iconComponent: ICON_REGISTRY['ideas'], color: '#eab308' },
    { slug: 'music', name: 'موسیقی', icon: 'music', iconComponent: ICON_REGISTRY['music'], color: '#f43f5e' },
    { slug: 'other', name: 'سایر', icon: 'other', iconComponent: ICON_REGISTRY['other'], color: '#9ca3af' },
]

export const DEFAULT_CATEGORY = 'other'

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
    return CATEGORIES.find((c) => c.slug === slug)
}

export function getCategoryMeta(slug: string | null | undefined): CategoryMeta {
    return getCategoryBySlug(slug ?? '') ?? getCategoryBySlug(DEFAULT_CATEGORY)!
}

export function getCategoryIcon(iconName: string | null | undefined): IconType {
    return ICON_REGISTRY[iconName ?? ''] ?? LuTag
}