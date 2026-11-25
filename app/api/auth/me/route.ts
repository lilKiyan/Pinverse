import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
    const user = await getCurrentUser()
    
    if (!user) {
        return NextResponse.json({ user: null }, { status: 200 })
    }
    return NextResponse.json({ user })
}