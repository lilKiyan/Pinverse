"use client"

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from './authStore'


export function useUnreadCount() {
    const user = useAuthStore((state) => state.user)
    const userId = user?.id

    const { data } = useQuery<{ count: number }>({
        queryKey: ['unread-count', userId],
        queryFn: async () => {
            const res = await fetch('/api/notifications/unread-count')
            if (!res.ok) return { count: 0 }
            return res.json()
        },
        enabled: !!userId,
        refetchInterval: 10000, // هر ۱۰ ثانیه چک کن
        refetchOnWindowFocus: true,
        staleTime: 5000,
    })

    return data?.count ?? 0
}