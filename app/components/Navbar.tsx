"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FiSearch,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
  FiGrid,
  FiLogIn,
  FiUserPlus,
  FiX,
  FiLoader,
  FiArrowLeft,
  FiUsers,
  FiImage,
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/authStore'
import { useDragScroll } from '@/lib/useDragScroll'

type Board = {
  id: string
  name: string
}

type PinSuggestion = {
  id: string
  title: string
  imageUrl: string
}

type UserSuggestion = {
  id: string
  name: string
  username: string
  avatar: string | null
}

type FlatItem =
  | { type: 'user'; id: string; data: UserSuggestion }
  | { type: 'pin'; id: string; data: PinSuggestion }

const DROPDOWN_ANIMATION_MS = 220
const STAGGER_MS = 35
const SEARCH_DEBOUNCE_MS = 300
const MAX_PIN_SUGGESTIONS = 4
const MAX_USER_SUGGESTIONS = 3

const Navbar = () => {
  const { user, setUser } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const boardsScrollRef = useDragScroll<HTMLDivElement>()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const { data: fetchedUser } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) throw new Error('Not logged in')
      const data = await res.json()
      return data.user
    },
    enabled: !user,
    staleTime: Infinity,
    retry: false,
  })

  useEffect(() => {
    if (fetchedUser) setUser(fetchedUser)
  }, [fetchedUser, setUser])

  const { data: boards = [] } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await fetch('/api/boards')
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  })

  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: ['navbar-search', debouncedQuery],
    queryFn: async () => {
      const [pinsRes, usersRes] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`),
        fetch(`/api/search/users?q=${encodeURIComponent(debouncedQuery)}`),
      ])

      const pinsData = pinsRes.ok ? await pinsRes.json() : { pins: [] }
      const usersData = usersRes.ok ? await usersRes.json() : { users: [] }

      return {
        pins: (pinsData.pins || []).slice(0, MAX_PIN_SUGGESTIONS).map((pin: any) => ({
          id: pin.id,
          title: pin.title,
          imageUrl: pin.imageUrl,
        })) as PinSuggestion[],
        users: (usersData.users || []).slice(0, MAX_USER_SUGGESTIONS).map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          avatar: u.avatar,
        })) as UserSuggestion[],
      }
    },
    enabled: !!debouncedQuery,
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const pinSuggestions = searchData?.pins ?? []
  const userSuggestions = searchData?.users ?? []

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    const trimmed = searchQuery.trim()

    if (!trimmed) {
      setDebouncedQuery('')
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(trimmed)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [searchQuery])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      queryClient.removeQueries({ queryKey: ['me'] })
      queryClient.setQueryData(['boards'], [])
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('خطا در خروج:', error)
    }
  }

  const openDropdown = () => {
    setIsDropdownOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsDropdownVisible(true))
    })
  }

  const closeDropdown = () => {
    setIsDropdownVisible(false)
    setTimeout(() => setIsDropdownOpen(false), DROPDOWN_ANIMATION_MS)
  }

  const toggleDropdown = () => {
    if (isDropdownOpen) closeDropdown()
    else openDropdown()
  }

  useEffect(() => {
    if (!isDropdownOpen) return
    const handleScroll = () => closeDropdown()
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [isDropdownOpen])

  useEffect(() => {
    if (!isDropdownOpen) return

    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (profileRef.current && !profileRef.current.contains(target)) {
        closeDropdown()
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)   
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      setShowSuggestions(true)
    }
    setHighlightedIndex(-1)
  }, [searchQuery])

  const flatItems: FlatItem[] = [
    ...userSuggestions.map((u) => ({ type: 'user' as const, id: u.id, data: u })),
    ...pinSuggestions.map((p) => ({ type: 'pin' as const, id: p.id, data: p })),
  ]

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedQuery('')
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }, [])

  const goToUser = useCallback(
    (userId: string) => {
      clearSearch()
      router.push(`/user/${userId}`)
    },
    [router, clearSearch]
  )

  const goToPin = useCallback(
    (pinId: string) => {
      clearSearch()
      router.push(`/pin/${pinId}`)
    },
    [router, clearSearch]
  )

  const goToFullSearch = useCallback(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    clearSearch()
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }, [router, searchQuery, clearSearch])

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || flatItems.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        goToFullSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % flatItems.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev <= 0 ? flatItems.length - 1 : prev - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < flatItems.length) {
          const item = flatItems[highlightedIndex]
          if (item.type === 'user') goToUser(item.id)
          else goToPin(item.id)
        } else {
          goToFullSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const highlightMatch = (title: string, query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return title
    const index = title.toLowerCase().indexOf(trimmed.toLowerCase())
    if (index === -1) return title
    return (
      <>
        {title.slice(0, index)}
        <mark className="bg-red-100 text-red-700 rounded px-0.5">
          {title.slice(index, index + trimmed.length)}
        </mark>
        {title.slice(index + trimmed.length)}
      </>
    )
  }

  const userInitial = user?.username?.trim().charAt(0) || '؟'

  const loggedInItems = [
    { href: '/profile', icon: FiUser, label: 'پروفایل' },
    { href: '/myboards', icon: FiGrid, label: 'بردها' },
    { href: '/settings', icon: FiSettings, label: 'تنظیمات' },
  ]

  const loggedOutItems = [
    { href: '/login', icon: FiLogIn, label: 'ورود' },
    { href: '/register', icon: FiUserPlus, label: 'ثبت‌نام' },
  ]

  const showSuggestionBox = showSuggestions && searchQuery.trim().length > 0
  const hasResults = flatItems.length > 0
  const showEmpty = !isSearching && !hasResults && debouncedQuery === searchQuery.trim()

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-3 md:px-4 h-14 md:h-16 gap-3 md:gap-4">
        <div ref={searchContainerRef} className="relative flex-1 w-full min-w-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              goToFullSearch()
            }}
          >
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="جستجو"
                aria-label="جستجو در پین‌ها و کاربران"
                className="w-full bg-gray-100 border border-transparent rounded-full pr-9 pl-9 py-2 md:py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100 transition-all duration-200"
              />

              <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                {isSearching ? (
                  <FiLoader className="w-4 h-4 text-red-500 animate-spin" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="پاک کردن جستجو"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          {showSuggestionBox && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-[min(520px,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl shadow-black/10 ring-1 ring-black/5 overflow-hidden z-50 animate-[fadeInDown_0.18s_ease-out]">

              {isSearching && !hasResults ? (
                <div className="py-3 space-y-1">
                  <div className="px-4 pt-2 pb-1.5">
                    <div className="h-3 w-16 rounded-full bg-gray-100 animate-pulse" />
                  </div>
                  {[0, 1].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-9 h-9 rounded-full bg-gray-200/70 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-28 rounded-full bg-gray-200/70 animate-pulse" />
                        <div className="h-2.5 w-20 rounded-full bg-gray-100 animate-pulse" />
                      </div>
                    </div>
                  ))}
                  <div className="px-4 pt-3 pb-1.5 border-t border-gray-50">
                    <div className="h-3 w-14 rounded-full bg-gray-100 animate-pulse" />
                  </div>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-11 h-11 rounded-xl bg-gray-200/70 animate-pulse shrink-0" />
                      <div className="h-3 w-40 rounded-full bg-gray-200/70 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : hasResults ? (
                <div className="max-h-[min(70vh,520px)] overflow-y-auto scroll-smooth
                  [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-thumb]:bg-gray-200
                  [&::-webkit-scrollbar-thumb]:hover:bg-gray-300
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-track]:bg-transparent">

                  {userSuggestions.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2 px-4 pb-1.5">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center shrink-0">
                          <FiUsers className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[11px] font-extrabold text-gray-500 tracking-wider">
                          کاربران
                        </span>
                        <span className="text-[10px] font-bold bg-fuchsia-50 text-fuchsia-600 px-1.5 py-0.5 rounded-full tabular-nums">
                          {userSuggestions.length}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-100 to-transparent" />
                      </div>

                      {userSuggestions.map((u, idx) => {
                        const globalIdx = idx
                        const isHighlighted = highlightedIndex === globalIdx
                        return (
                          <button
                            key={u.id}
                            role="option"
                            aria-selected={isHighlighted}
                            onClick={() => goToUser(u.id)}
                            onMouseEnter={() => setHighlightedIndex(globalIdx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors cursor-pointer group ${isHighlighted ? 'bg-gradient-to-l from-fuchsia-50/80 to-transparent' : 'hover:bg-gray-50'
                              }`}
                          >
                            <div className={`p-[2px] rounded-full shrink-0 transition-all ${isHighlighted
                              ? 'bg-gradient-to-br from-fuchsia-500 via-purple-500 to-pink-500'
                              : 'bg-gradient-to-br from-gray-200 to-gray-300'
                              }`}>
                              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white ring-2 ring-white flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-red-500 to-orange-500">
                                {u.avatar ? (
                                  <Image
                                    src={u.avatar}
                                    alt={u.name}
                                    fill
                                    sizes="36px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <span>{u.username?.charAt(0).toUpperCase() || '؟'}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate transition-colors ${isHighlighted ? 'text-fuchsia-700' : 'text-gray-900'
                                }`}>
                                {highlightMatch(u.name, searchQuery)}
                              </p>
                              <p className="text-xs text-gray-400 truncate" dir="ltr">
                                @{u.username}
                              </p>
                            </div>

                            <FiArrowLeft className={`w-3.5 h-3.5 shrink-0 transition-all ${isHighlighted
                              ? 'text-fuchsia-500 -translate-x-0.5'
                              : 'text-gray-300'
                              }`} />
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {pinSuggestions.length > 0 && (
                    <div className={`pt-2 ${userSuggestions.length > 0 ? 'border-t border-gray-100' : ''}`}>
                      <div className="flex items-center gap-2 px-4 pb-1.5">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
                          <FiImage className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[11px] font-extrabold text-gray-500 tracking-wider">
                          پین‌ها
                        </span>
                        <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full tabular-nums">
                          {pinSuggestions.length}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-100 to-transparent" />
                      </div>

                      {pinSuggestions.map((p, idx) => {
                        const globalIdx = userSuggestions.length + idx
                        const isHighlighted = highlightedIndex === globalIdx
                        return (
                          <button
                            key={p.id}
                            role="option"
                            aria-selected={isHighlighted}
                            onClick={() => goToPin(p.id)}
                            onMouseEnter={() => setHighlightedIndex(globalIdx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors cursor-pointer group ${isHighlighted ? 'bg-gradient-to-l from-red-50/80 to-transparent' : 'hover:bg-gray-50'
                              }`}
                          >
                            <div className={`relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 transition-all ${isHighlighted
                              ? 'ring-2 ring-red-300 shadow-md shadow-red-100'
                              : 'ring-1 ring-black/5'
                              }`}>
                              <Image
                                src={p.imageUrl}
                                alt=""
                                fill
                                sizes="44px"
                                className="object-cover"
                                loading="lazy"
                              />
                            </div>

                            <span className={`flex-1 text-sm font-semibold truncate transition-colors ${isHighlighted ? 'text-red-700' : 'text-gray-800'
                              }`}>
                              {highlightMatch(p.title, searchQuery)}
                            </span>

                            <FiArrowLeft className={`w-3.5 h-3.5 shrink-0 transition-all ${isHighlighted
                              ? 'text-red-500 -translate-x-0.5'
                              : 'text-gray-300'
                              }`} />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : showEmpty ? (
                <div className="px-4 py-10 text-center">
                  <div className="relative w-14 h-14 mx-auto mb-3">
                    <div className="absolute inset-0 bg-red-100/60 rounded-full blur-xl" />
                    <div className="relative w-14 h-14 rounded-2xl bg-white shadow-md ring-1 ring-black/5 flex items-center justify-center rotate-3">
                      <FiSearch className="w-6 h-6 text-gray-300" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-bold mb-1">
                    چیزی پیدا نشد
                  </p>
                  <p className="text-xs text-gray-400">
                    برای «{searchQuery.trim()}» نتیجه‌ای نیست
                  </p>
                </div>
              ) : null}

              <button
                onClick={goToFullSearch}
                className="w-full flex items-center justify-between px-4 py-4 border-t border-gray-100 bg-gradient-to-l from-gray-50/60 to-transparent hover:from-red-50/70 transition-all cursor-pointer group"
              >
                <span className="text-sm font-bold text-red-600 group-hover:text-red-700">
                  مشاهده همه‌ی نتایج
                </span>
                <FiArrowLeft className="w-4 h-4 text-red-500 transition-transform group-hover:-translate-x-1" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

          <div className="relative" ref={profileRef}>
            <div className="flex items-center gap-0.5 pl-1 pr-0.5 py-0.5 rounded-full hover:bg-gray-100 transition-colors duration-200">
              <button
                onClick={toggleDropdown}
                aria-label="منوی حساب کاربری"
                className={`w-8 h-8 overflow-hidden md:w-9 md:h-9 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer transition-transform hover:scale-105 active:scale-95 ${user
                  ? 'bg-gradient-to-br from-red-500 to-red-600 ring-2 ring-white shadow-sm'
                  : 'bg-gray-200 text-gray-500 ring-1 ring-gray-300 hover:bg-gray-300'
                  }`}
              >
                {user ? (
                  user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name || 'آواتار'}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="h-[16px] md:h-[18px]">{userInitial}</span>
                  )
                ) : (
                  <FiUser className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>
              <button
                onClick={toggleDropdown}
                aria-label="منوی حساب کاربری"
                className="hidden md:flex w-7 h-7 rounded-full items-center justify-center text-gray-500 cursor-pointer transition-all duration-200 hover:bg-gray-100"
              >
                <FiChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isDropdownVisible ? 'rotate-180' : ''
                    }`}
                />
              </button>
            </div>

            {isDropdownOpen && (
              <>
              

                <div
                  className={`absolute left-0 mt-3 w-52 md:w-56 bg-white rounded-2xl shadow-2xl shadow-black/5 ring-1 ring-black/5 z-50 overflow-hidden origin-top-left transition-all ease-out ${isDropdownVisible
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2'
                    }`}
                  style={{ transitionDuration: `${DROPDOWN_ANIMATION_MS}ms` }}
                >
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-400">
                      {user ? 'حساب کاربری' : 'خوش آمدید'}
                    </p>
                  </div>

                  {user ? (
                    <>
                      {loggedInItems.map((item, index) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeDropdown}
                            style={{
                              transitionDelay: isDropdownVisible ? `${index * STAGGER_MS}ms` : '0ms',
                            }}
                            className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all no-underline ${isDropdownVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                              }`}
                          >
                            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                              <Icon className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                            </span>
                            {item.label}
                          </Link>
                        )
                      })}

                      <div className="h-px bg-gray-50 mx-2" />

                      <button
                        onClick={() => {
                          closeDropdown()
                          handleLogout()
                        }}
                        style={{
                          transitionDelay: isDropdownVisible ? `${loggedInItems.length * STAGGER_MS}ms` : '0ms',
                        }}
                        className={`group rounded-b-2xl w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-all cursor-pointer ${isDropdownVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                          }`}
                      >
                        <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                          <FiLogOut className="w-4 h-4" />
                        </span>
                        خروج
                      </button>
                    </>
                  ) : (
                    <>
                      {loggedOutItems.map((item, index) => {
                        const Icon = item.icon
                        const isLast = index === loggedOutItems.length - 1
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeDropdown}
                            style={{
                              transitionDelay: isDropdownVisible ? `${index * STAGGER_MS}ms` : '0ms',
                            }}
                            className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all no-underline ${isLast ? 'rounded-b-2xl' : ''
                              } ${isDropdownVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}
                          >
                            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                              <Icon className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                            </span>
                            {item.label}
                          </Link>
                        )
                      })}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {boards.length > 0 && (
        <div
          ref={boardsScrollRef}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 pb-2.5 pt-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] nav-boards cursor-grab select-none"
        >
          <Link
            href="/"
            className="flex-shrink-0 px-3.5 md:px-4 py-1 md:py-1.5 bg-red-600 text-white rounded-full text-xs font-medium hover:bg-red-700 shadow-sm shadow-red-100 transition-colors no-underline"
          >
            همه
          </Link>

          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className="flex-shrink-0 px-3.5 md:px-4 py-1 md:py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200 no-underline"
            >
              {board.name}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </header>
  )
}

export default Navbar