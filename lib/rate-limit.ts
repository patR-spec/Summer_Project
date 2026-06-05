// Simple in-memory rate limiter.
// Caveats: resets on server restart; doesn't share state across Vercel regions.
// Good enough for hobby/small business volume. Upgrade to Redis if you scale.

type Bucket = {
    count: number
    resetAt: number
  }
  
  const buckets = new Map<string, Bucket>()
  
  // Clean up old buckets every 5 minutes to avoid memory leaks
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt < now) {
        buckets.delete(key)
      }
    }
  }, 5 * 60 * 1000)
  
  type RateLimitOptions = {
    key: string         // e.g. an IP address or user ID
    limit: number       // max requests
    windowMs: number    // time window in ms
  }
  
  export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions): {
    allowed: boolean
    remaining: number
    resetAt: number
  } {
    const now = Date.now()
    const bucket = buckets.get(key)
  
    if (!bucket || bucket.resetAt < now) {
      // Fresh window
      const newBucket = { count: 1, resetAt: now + windowMs }
      buckets.set(key, newBucket)
      return { allowed: true, remaining: limit - 1, resetAt: newBucket.resetAt }
    }
  
    bucket.count++
    if (bucket.count > limit) {
      return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
    }
  
    return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
  }
  
  /**
   * Extract a reasonable identifier from a request — typically the IP address.
   * Falls back to a fixed string if no IP available (which would rate-limit globally — bad).
   */
  export function getRateLimitKey(request: Request, prefix: string = ''): string {
    // Vercel sets x-forwarded-for to the real client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0]?.trim() ?? realIp ?? 'unknown'
    return `${prefix}:${ip}`
  }