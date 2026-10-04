"use client"

import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useQueryClient, useQuery } from '@tanstack/react-query'
import PinCard from './components/PinCard'
import { FiAlertCircle, FiImage, FiCheckCircle } from 'react-icons/fi'
import Spinner from './components/Spinner'
import Link from 'next/link'
import { FiTag } from 'react-icons/fi'
import { getCategoryIcon } from '@/lib/categories'

const LIMIT = 12

export default function Home() {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [category, setCategory] = useState('other')

  const { data: categoriesData } = useQuery<{ categories: { slug: string; name: string; icon: string; color: string }[] }>({
    queryKey: ['categories-all'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('خطا')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
  const categories = categoriesData?.categories ?? []

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['pins', activeCategory],
    queryFn: async ({ pageParam = 1 }) => {
      const url = new URL(`/api/pins`, window.location.origin)
      url.searchParams.set('page', String(pageParam))
      url.searchParams.set('limit', String(LIMIT))
      if (activeCategory) url.searchParams.set('category', activeCategory)

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('خطا در دریافت پین‌ها')
      return res.json()
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 0,
  })

  const pins = data?.pages.flatMap((page) => page.pins) ?? []

  const handleCategoryChange = (slug: string | null) => {
    setActiveCategory(slug)
    queryClient.removeQueries({ queryKey: ['pins'] })
  }

  // ── IntersectionObserver برای infinite scroll ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage()
        }
      },
      { rootMargin: '50px' }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handlePinUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['pins'] })
  }

  if (isLoading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className='mt-35' />
      </main>
    )
  }

  if (isError) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl text-sm max-w-md">
          <FiAlertCircle className="w-5 h-5 shrink-0" />
          <span>{(error as Error).message}</span>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 pt-4 scrollbar-none px-1">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all
              cursor-pointer active:scale-95 ${activeCategory === null
              ? 'bg-gray-900 text-white shadow-md'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-gray-400'
            }`}
        >
          همه
        </button>

        {categories.map((cat) => {
          const isActive = category === cat.slug
          const Icon = getCategoryIcon(cat.icon)
          return (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                  text-xs font-bold transition-all
                  cursor-pointer active:scale-95 hover:-translate-y-0.5 hover:shadow-md
                  ${isActive
                  ? 'text-white shadow-md'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-gray-400'
                }`}
              style={isActive ? { backgroundColor: cat.color } : undefined}
            >
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: isActive ? '#ffffff' : cat.color }}
              />
              {cat.name}
            </button>
          )
        })}
        <Link
          href="/categories"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full
              text-xs font-bold text-gray-900
              bg-white ring-1 ring-gray-900
              hover:bg-gray-900 hover:text-white
              transition-all cursor-pointer active:scale-95"
        >
          <FiTag className="w-3.5 h-3.5" />
          همه‌ی دسته‌ها
        </Link>
      </div>

      {pins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center mb-4">
            <FiImage className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm">
            هنوز پینی ساخته نشده. اولین پین رو اضافه کن!
          </p>
        </div>
      ) : (

        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {pins.map((pin, index) => (
            <PinCard
              key={pin.id}
              pin={pin}
              optionsRotationDefault={-80}
              priority={index < 4}
              onDeletePin={handlePinUpdate}
              onRemoveFromBoard={handlePinUpdate}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center items-center py-8">
          <Spinner size="sm" label="در حال بارگذاری پین‌های بیشتر..." />
        </div>
      )}

      {!hasNextPage && pins.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-2.5 py-10 mb-10 md:mb-0">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <FiCheckCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-gray-400 text-sm">به انتهای پین‌ها رسیدی</p>
        </div>
      )}
    </main>
  )
}