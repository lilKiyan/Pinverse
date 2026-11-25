"use client"

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from './authStore'

export function useNotificationsCount() {
    const user = useAuthStore((state) => state.user)
    const userId = user?.id

    const { data } = useQuery<{ count: number }>({
        queryKey: ['notifications-count', userId],
        queryFn: async () => {
            const res = await fetch('/api/notifications/count')
            if (!res.ok) return { count: 0 }
            return res.json()
        },
        enabled: !!userId,
        refetchInterval: 15000,
        staleTime: 10000,
    })

    return data?.count ?? 0
}