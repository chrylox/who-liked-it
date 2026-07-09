/**
 * Unit tests for TikTok URL handling in Who Liked It?
 */

describe('TikTok URL handling', () => {
  const TIKTOK_URL_PATTERN = /^https?:\/\/([a-z0-9-]+\.)?tiktok\.com\//i;
  const SHORT_LINK_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com"]);

  describe('TIKTOK_URL_PATTERN validation', () => {
    const validUrls = [
      'https://www.tiktok.com/video/123456789',
      'http://www.tiktok.com/video/123456789',
      'https://tiktok.com/video/123456789',
      'http://tiktok.com/video/123456789',
      'https://m.tiktok.com/video/123456789',
      'http://m.tiktok.com/video/123456789',
      'https://vm.tiktok.com/ZGd9CtUac/',
      'http://vm.tiktok.com/ZGd9CtUac/',
      'https://vt.tiktok.com/ZGd9CtUac/',
      'http://vt.tiktok.com/ZGd9CtUac/',
      'https://www.tiktok.com/@username/video/123456789',
      'https://www.tiktok.com/video/123456789?is_copy_url=1&is_from_webapp=v1',
      'https://www.tiktok.com/video/123456789?is_copy_url=1&is_from_webapp=v1&sender_device=pc',
    ];

    const invalidUrls = [
      'https://youtube.com/watch?v=123456789',
      'https://twitter.com/user/status/123456789',
      'https://instagram.com/reel/123456789',
      'https://example.com',
      'tiktok.com/video/123456789', // missing protocol
      'www.tiktok.com/video/123456789', // missing protocol
      'ftp://tiktok.com/video/123456789', // wrong protocol
      '',
      'not a url',
      'https://',
      'http://',
    ];

    it.each(validUrls)('accepts valid TikTok URL: %s', (url) => {
      expect(TIKTOK_URL_PATTERN.test(url)).toBe(true);
    });

    it.each(invalidUrls)('rejects invalid URL: %s', (url) => {
      expect(TIKTOK_URL_PATTERN.test(url)).toBe(false);
    });
  });

  describe('extractTikTokVideoId', () => {
    function extractTikTokVideoId(url) {
      if (!url) return null;
      const match = url.match(/\/video\/(\d+)/);
      return match ? match[1] : null;
    }

    it.each([
      ['https://www.tiktok.com/video/123456789', '123456789'],
      ['http://www.tiktok.com/video/123456789', '123456789'],
      ['https://tiktok.com/video/987654321', '987654321'],
      ['https://m.tiktok.com/video/111222333', '111222333'],
      ['https://www.tiktok.com/video/123456789?is_copy_url=1', '123456789'],
      ['https://www.tiktok.com/video/123456789?is_copy_url=1&is_from_webapp=v1', '123456789'],
      ['https://www.tiktok.com/@username/video/123456789', '123456789'],
    ])('extracts video ID from %s', (url, expectedId) => {
      expect(extractTikTokVideoId(url)).toBe(expectedId);
    });

    it.each([
      ['https://www.tiktok.com/@username', null],
      ['https://www.tiktok.com/', null],
      ['https://vm.tiktok.com/ZGd9CtUac/', null],
      ['https://vt.tiktok.com/ZGd9CtUac/', null],
      ['https://youtube.com/watch?v=123456789', null],
      ['', null],
      ['not a url', null],
      [null, null],
      [undefined, null],
    ])('returns null for %s', (url, expected) => {
      expect(extractTikTokVideoId(url)).toBe(expected);
    });
  });

  describe('SHORT_LINK_HOSTS detection', () => {
    it.each([
      ['vm.tiktok.com', true],
      ['vt.tiktok.com', true],
      ['VM.TIKTOK.COM', true], // case insensitive
      ['VT.TIKTOK.COM', true],
    ])('identifies %s as short link host', (host) => {
      expect(SHORT_LINK_HOSTS.has(host.toLowerCase())).toBe(true);
    });

    it.each([
      ['www.tiktok.com', false],
      ['tiktok.com', false],
      ['m.tiktok.com', false],
      ['example.com', false],
    ])('does not identify %s as short link host', (host) => {
      expect(SHORT_LINK_HOSTS.has(host)).toBe(false);
    });
  });

  describe('needsShortLinkResolution', () => {
    function needsShortLinkResolution(url) {
      try {
        const hostname = new URL(url).hostname;
        return SHORT_LINK_HOSTS.has(hostname);
      } catch (err) {
        return false;
      }
    }

    it.each([
      ['https://vm.tiktok.com/ZGd9CtUac/', true],
      ['https://vt.tiktok.com/ZGd9CtUac/', true],
      ['http://vm.tiktok.com/ZGd9CtUac/', true],
      ['http://vt.tiktok.com/ZGd9CtUac/', true],
    ])('returns true for short link: %s', (url) => {
      expect(needsShortLinkResolution(url)).toBe(true);
    });

    it.each([
      ['https://www.tiktok.com/video/123456789', false],
      ['https://tiktok.com/video/123456789', false],
      ['https://m.tiktok.com/video/123456789', false],
      ['https://example.com', false],
      ['not a url', false],
      ['', false],
    ])('returns false for non-short link: %s', (url) => {
      expect(needsShortLinkResolution(url)).toBe(false);
    });
  });

  describe('TikTok embed URL generation', () => {
    function generateEmbedUrl(videoUrl) {
      const id = videoUrl.match(/\/video\/(\d+)/)?.[1];
      if (id) {
        return `https://www.tiktok.com/player/v1/${id}?music_info=0&description=0`;
      }
      return null;
    }

    it.each([
      ['https://www.tiktok.com/video/123456789', 'https://www.tiktok.com/player/v1/123456789?music_info=0&description=0'],
      ['https://m.tiktok.com/video/987654321', 'https://www.tiktok.com/player/v1/987654321?music_info=0&description=0'],
    ])('generates embed URL from %s', (input, expected) => {
      expect(generateEmbedUrl(input)).toBe(expected);
    });

    it.each([
      ['https://vm.tiktok.com/ZGd9CtUac/', null],
      ['https://www.tiktok.com/@username', null],
      ['', null],
    ])('returns null for non-video URL: %s', (input) => {
      expect(generateEmbedUrl(input)).toBeNull();
    });
  });
});

describe('URL normalization', () => {
  it('strips query parameters from TikTok URLs', () => {
    const url = 'https://www.tiktok.com/video/123456789?is_copy_url=1&is_from_webapp=v1';
    const normalized = url.split('?')[0];
    expect(normalized).toBe('https://www.tiktok.com/video/123456789');
  });

  it('handles URLs without query parameters', () => {
    const url = 'https://www.tiktok.com/video/123456789';
    const normalized = url.split('?')[0];
    expect(normalized).toBe(url);
  });

  it('handles empty URLs', () => {
    const url = '';
    const normalized = url.split('?')[0];
    expect(normalized).toBe('');
  });
});
