type Bucket = {
    count: number
    resetAt: number
}

const buckets = new Map<string, Bucket>()
const globalForSweeper = globalThis as unknown as { __rlSweeperStarted?: boolean }

if (!globalForSweeper.__rlSweeperStarted) {
    globalForSweeper.__rlSweeperStarted = true

    setInterval(() => {
        const now = Date.now()
        for (const [key, bucket] of buckets) {
            if (bucket.resetAt < now) buckets.delete(key)
        }
    }, 60_000)
}

type RateLimitOptions = {
    limit: number
    windowMs: number
}

export function rateLimit(
    identifier: string,
    { limit, windowMs }: RateLimitOptions
): { ok: boolean; remaining: number; retryAfter: number } {
    const now = Date.now()

    let bucket = buckets.get(identifier)

    if (!bucket || bucket.resetAt < now) {
        bucket = { count: 0, resetAt: now + windowMs }
        buckets.set(identifier, bucket)
    }

    bucket.count++

    if (bucket.count > limit) {
        return {
            ok: false,
            remaining: 0,
            retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
        }
    }

    return { ok: true, remaining: limit - bucket.count, retryAfter: 0 }
}

export function getClientIp(request: Request): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
    )
}