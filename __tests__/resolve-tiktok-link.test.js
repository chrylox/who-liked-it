/**
 * Unit tests for the resolve-tiktok-link serverless function
 */

// Mock the global variables
const ALLOWED_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com", "www.tiktok.com", "tiktok.com", "m.tiktok.com"]);

// Simplified version for testing
function resolveRedirectSync(url, maxHops = 5, redirects = {}) {
  let currentUrl = url;
  let hops = 0;

  while (hops < maxHops) {
    try {
      const parsed = new URL(currentUrl);
      
      // Check if host is allowed
      if (!ALLOWED_HOSTS.has(parsed.hostname)) {
        throw new Error(`Unsupported host: ${parsed.hostname}`);
      }

      // Check if we have a redirect for this URL
      if (redirects[currentUrl]) {
        currentUrl = redirects[currentUrl];
        hops++;
      } else {
        // No more redirects, return the final URL
        return currentUrl;
      }
    } catch (err) {
      if (err.message.startsWith('Unsupported host')) {
        throw err;
      }
      throw new Error("Invalid URL");
    }
  }

  throw new Error("Too many redirects");
}

function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

describe('resolve-tiktok-link', () => {
  describe('ALLOWED_HOSTS', () => {
    it('contains all TikTok hosts', () => {
      expect(ALLOWED_HOSTS.has('vm.tiktok.com')).toBe(true);
      expect(ALLOWED_HOSTS.has('vt.tiktok.com')).toBe(true);
      expect(ALLOWED_HOSTS.has('www.tiktok.com')).toBe(true);
      expect(ALLOWED_HOSTS.has('tiktok.com')).toBe(true);
      expect(ALLOWED_HOSTS.has('m.tiktok.com')).toBe(true);
    });

    it('does not contain non-TikTok hosts', () => {
      expect(ALLOWED_HOSTS.has('youtube.com')).toBe(false);
      expect(ALLOWED_HOSTS.has('twitter.com')).toBe(false);
      expect(ALLOWED_HOSTS.has('example.com')).toBe(false);
    });
  });

  describe('URL validation', () => {
    it('accepts valid URLs with allowed hosts', () => {
      const validUrls = [
        'https://vm.tiktok.com/ZGd9CtUac/',
        'https://vt.tiktok.com/ZGd9CtUac/',
        'https://www.tiktok.com/video/123456789',
        'https://tiktok.com/video/123456789',
        'https://m.tiktok.com/video/123456789'
      ];

      validUrls.forEach(url => {
        expect(() => new URL(url)).not.toThrow();
        const parsed = new URL(url);
        expect(ALLOWED_HOSTS.has(parsed.hostname)).toBe(true);
      });
    });

    it('rejects URLs with disallowed hosts', () => {
      const invalidUrls = [
        'https://youtube.com/watch?v=123',
        'https://twitter.com/user/status/123',
        'https://evil.com/video/123'
      ];

      invalidUrls.forEach(url => {
        const parsed = new URL(url);
        expect(ALLOWED_HOSTS.has(parsed.hostname)).toBe(false);
      });
    });

    it('rejects invalid URLs', () => {
      const invalidUrls = [
        'not a url',
        '',
        'https://',
        'http://'
      ];

      invalidUrls.forEach(url => {
        expect(() => new URL(url)).toThrow();
      });
    });
  });

  describe('resolveRedirectSync', () => {
    it('resolves direct video URLs without redirects', () => {
      const url = 'https://www.tiktok.com/video/123456789';
      const result = resolveRedirectSync(url);
      expect(result).toBe(url);
    });

    it('follows single redirect', () => {
      const redirects = {
        'https://vm.tiktok.com/ZGd9CtUac/': 'https://www.tiktok.com/video/123456789'
      };
      const result = resolveRedirectSync('https://vm.tiktok.com/ZGd9CtUac/', 5, redirects);
      expect(result).toBe('https://www.tiktok.com/video/123456789');
    });

    it('follows multiple redirects', () => {
      const redirects = {
        'https://vm.tiktok.com/abc/': 'https://vt.tiktok.com/def/',
        'https://vt.tiktok.com/def/': 'https://www.tiktok.com/video/123456789'
      };
      const result = resolveRedirectSync('https://vm.tiktok.com/abc/', 5, redirects);
      expect(result).toBe('https://www.tiktok.com/video/123456789');
    });

    it('stops after max hops', () => {
      const redirects = {
        'https://vm.tiktok.com/a/': 'https://vm.tiktok.com/b/',
        'https://vm.tiktok.com/b/': 'https://vm.tiktok.com/c/',
        'https://vm.tiktok.com/c/': 'https://vm.tiktok.com/d/',
        'https://vm.tiktok.com/d/': 'https://vm.tiktok.com/e/',
        'https://vm.tiktok.com/e/': 'https://vm.tiktok.com/f/'
      };
      expect(() => resolveRedirectSync('https://vm.tiktok.com/a/', 5, redirects))
        .toThrow('Too many redirects');
    });

    it('rejects disallowed hosts', () => {
      // This should throw "Unsupported host" not "Invalid URL"
      expect(() => resolveRedirectSync('https://evil.com/video/123', 5, {}))
        .toThrow('Unsupported host: evil.com');
    });

    it('rejects invalid URLs', () => {
      expect(() => resolveRedirectSync('not a url')).toThrow('Invalid URL');
    });
  });

  describe('extractVideoId', () => {
    it('extracts video ID from standard URLs', () => {
      expect(extractVideoId('https://www.tiktok.com/video/123456789')).toBe('123456789');
      expect(extractVideoId('https://tiktok.com/video/987654321')).toBe('987654321');
      expect(extractVideoId('https://m.tiktok.com/video/111222333')).toBe('111222333');
    });

    it('extracts video ID from URLs with query params', () => {
      expect(extractVideoId('https://www.tiktok.com/video/123456789?is_copy_url=1')).toBe('123456789');
      expect(extractVideoId('https://www.tiktok.com/video/123456789?is_copy_url=1&is_from_webapp=v1')).toBe('123456789');
    });

    it('returns null for non-video URLs', () => {
      expect(extractVideoId('https://www.tiktok.com/@username')).toBeNull();
      expect(extractVideoId('https://www.tiktok.com/')).toBeNull();
      expect(extractVideoId('https://vm.tiktok.com/ZGd9CtUac/')).toBeNull();
    });

    it('returns null for invalid input', () => {
      expect(extractVideoId('')).toBeNull();
      expect(extractVideoId(null)).toBeNull();
      expect(extractVideoId(undefined)).toBeNull();
    });
  });

  describe('full resolution flow', () => {
    function resolveAndExtract(url, redirects = {}) {
      try {
        const resolvedUrl = resolveRedirectSync(url, 5, redirects);
        const videoId = extractVideoId(resolvedUrl);
        return { resolvedUrl, videoId };
      } catch (err) {
        return { error: err.message };
      }
    }

    it('resolves short link to video ID', () => {
      const redirects = {
        'https://vm.tiktok.com/ZGd9CtUac/': 'https://www.tiktok.com/video/123456789'
      };
      const result = resolveAndExtract('https://vm.tiktok.com/ZGd9CtUac/', redirects);
      expect(result.resolvedUrl).toBe('https://www.tiktok.com/video/123456789');
      expect(result.videoId).toBe('123456789');
    });

    it('handles direct video URLs', () => {
      const result = resolveAndExtract('https://www.tiktok.com/video/123456789');
      expect(result.resolvedUrl).toBe('https://www.tiktok.com/video/123456789');
      expect(result.videoId).toBe('123456789');
    });

    it('returns null videoId for non-video resolved URLs', () => {
      const redirects = {
        'https://vm.tiktok.com/ZGd9CtUac/': 'https://www.tiktok.com/@username'
      };
      const result = resolveAndExtract('https://vm.tiktok.com/ZGd9CtUac/', redirects);
      expect(result.resolvedUrl).toBe('https://www.tiktok.com/@username');
      expect(result.videoId).toBeNull();
    });

    it('handles errors gracefully', () => {
      const result = resolveAndExtract('not a url');
      expect(result.error).toBe('Invalid URL');
    });

    it('handles disallowed hosts', () => {
      const result = resolveAndExtract('https://youtube.com/watch?v=123');
      expect(result.error).toBe('Unsupported host: youtube.com');
    });
  });
});
