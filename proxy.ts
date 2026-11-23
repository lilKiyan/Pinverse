import { NextResponse } from 'next/server'

// در این نسخه صفحات محافظت‌شده مستقیماً به /login ریدایرکت نمی‌شوند،
// بلکه صفحه لود شده و پیام ورود به حساب (AuthGate) را به کاربر نمایش می‌دهد.
export async function proxy(_request: Request) {
    return NextResponse.next()
}

export const config = {
    matcher: [],
}
