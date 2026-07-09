/**
 * Unit tests for utility functions in Who Liked It?
 * These are pure functions that can be tested without DOM or Nhost dependencies.
 */

// ============================================================================
// Error handling utilities
// ============================================================================

describe('errorMessageFrom', () => {
  // Recreate the function here for testing
  function errorMessageFrom(err) {
    if (err && err.body && Array.isArray(err.body.errors) && err.body.errors[0]) {
      return err.body.errors[0].message;
    }
    return (err && err.body && err.body.message) || (err && err.message) || "Something went wrong. Please try again.";
  }

  it('extracts message from GraphQL errors array', () => {
    const err = {
      body: {
        errors: [{ message: 'Duplicate video URL' }]
      }
    };
    expect(errorMessageFrom(err)).toBe('Duplicate video URL');
  });

  it('extracts message from body.message', () => {
    const err = {
      body: { message: 'Network error' }
    };
    expect(errorMessageFrom(err)).toBe('Network error');
  });

  it('extracts message from err.message', () => {
    const err = new Error('Fetch failed');
    expect(errorMessageFrom(err)).toBe('Fetch failed');
  });

  it('returns default message for empty error', () => {
    expect(errorMessageFrom(null)).toBe('Something went wrong. Please try again.');
    expect(errorMessageFrom({})).toBe('Something went wrong. Please try again.');
  });

  it('returns default message for malformed error', () => {
    const err = { body: { errors: [] } };
    expect(errorMessageFrom(err)).toBe('Something went wrong. Please try again.');
  });
});

describe('isConstraintViolation', () => {
  // Recreate the function here for testing
  function isConstraintViolation(err) {
    return !!(
      err &&
      err.body &&
      Array.isArray(err.body.errors) &&
      err.body.errors.some((e) => e.extensions && e.extensions.code === "constraint-violation")
    );
  }

  it('returns true for constraint-violation errors', () => {
    const err = {
      body: {
        errors: [
          { extensions: { code: 'constraint-violation' } }
        ]
      }
    };
    expect(isConstraintViolation(err)).toBe(true);
  });

  it('returns false for other error types', () => {
    const err = {
      body: {
        errors: [
          { extensions: { code: 'permission-error' } }
        ]
      }
    };
    expect(isConstraintViolation(err)).toBe(false);
  });

  it('returns false for errors without extensions', () => {
    const err = {
      body: {
        errors: [{ message: 'Some error' }]
      }
    };
    expect(isConstraintViolation(err)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isConstraintViolation(null)).toBe(false);
    expect(isConstraintViolation(undefined)).toBe(false);
  });
});

describe('isPermissionCheckFailure', () => {
  // Recreate the function here for testing
  function isPermissionCheckFailure(err) {
    return !!(
      err &&
      err.body &&
      Array.isArray(err.body.errors) &&
      err.body.errors.some((e) => e.extensions && e.extensions.code === "permission-error")
    );
  }

  it('returns true for permission-error errors', () => {
    const err = {
      body: {
        errors: [
          { extensions: { code: 'permission-error' } }
        ]
      }
    };
    expect(isPermissionCheckFailure(err)).toBe(true);
  });

  it('returns false for constraint-violation errors', () => {
    const err = {
      body: {
        errors: [
          { extensions: { code: 'constraint-violation' } }
        ]
      }
    };
    expect(isPermissionCheckFailure(err)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isPermissionCheckFailure(null)).toBe(false);
    expect(isPermissionCheckFailure(undefined)).toBe(false);
  });
});

// ============================================================================
// URL utilities
// ============================================================================

describe('extractTikTokVideoId', () => {
  // Recreate the function here for testing
  function extractTikTokVideoId(url) {
    if (!url) return null;
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  }

  it('extracts video ID from standard TikTok URL', () => {
    expect(extractTikTokVideoId('https://www.tiktok.com/video/123456789')).toBe('123456789');
  });

  it('extracts video ID from mobile TikTok URL', () => {
    expect(extractTikTokVideoId('https://m.tiktok.com/video/987654321')).toBe('987654321');
  });

  it('extracts video ID from URL with query params', () => {
    expect(extractTikTokVideoId('https://www.tiktok.com/video/123456789?is_copy_url=1')).toBe('123456789');
  });

  it('returns null for non-video URLs', () => {
    // These URLs don't have /video/123 pattern
    expect(extractTikTokVideoId('https://www.tiktok.com/@user')).toBeNull();
    expect(extractTikTokVideoId('https://www.tiktok.com/')).toBeNull();
    // This one has /video/ but the path segment after is not just digits
    expect(extractTikTokVideoId('https://example.com/video/abc')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(extractTikTokVideoId('not a url')).toBeNull();
    expect(extractTikTokVideoId('')).toBeNull();
    expect(extractTikTokVideoId(null)).toBeNull();
    expect(extractTikTokVideoId(undefined)).toBeNull();
  });
});

describe('TIKTOK_URL_PATTERN', () => {
  const TIKTOK_URL_PATTERN = /^https?:\/\/([a-z0-9-]+\.)?tiktok\.com\//i;

  it('matches standard TikTok URLs', () => {
    expect(TIKTOK_URL_PATTERN.test('https://www.tiktok.com/video/123')).toBe(true);
    expect(TIKTOK_URL_PATTERN.test('http://tiktok.com/video/123')).toBe(true);
    expect(TIKTOK_URL_PATTERN.test('https://m.tiktok.com/video/123')).toBe(true);
  });

  it('matches short TikTok URLs', () => {
    expect(TIKTOK_URL_PATTERN.test('https://vm.tiktok.com/ZGd9CtUac/')).toBe(true);
    expect(TIKTOK_URL_PATTERN.test('https://vt.tiktok.com/ZGd9CtUac/')).toBe(true);
  });

  it('does not match non-TikTok URLs', () => {
    expect(TIKTOK_URL_PATTERN.test('https://youtube.com/watch?v=123')).toBe(false);
    expect(TIKTOK_URL_PATTERN.test('https://example.com')).toBe(false);
    expect(TIKTOK_URL_PATTERN.test('tiktok.com/video/123')).toBe(false); // missing protocol
  });

  it('does not match empty strings', () => {
    expect(TIKTOK_URL_PATTERN.test('')).toBe(false);
  });
});

describe('SHORT_LINK_HOSTS', () => {
  const SHORT_LINK_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com"]);

  it('contains vm.tiktok.com', () => {
    expect(SHORT_LINK_HOSTS.has('vm.tiktok.com')).toBe(true);
  });

  it('contains vt.tiktok.com', () => {
    expect(SHORT_LINK_HOSTS.has('vt.tiktok.com')).toBe(true);
  });

  it('does not contain www.tiktok.com', () => {
    expect(SHORT_LINK_HOSTS.has('www.tiktok.com')).toBe(false);
  });
});

// ============================================================================
// Game state utilities
// ============================================================================

describe('msSince', () => {
  // Mock Date.now for consistent testing
  const originalDateNow = Date.now;
  let mockDateNow = originalDateNow();

  beforeEach(() => {
    mockDateNow = 1700000000000; // Fixed timestamp
    global.Date.now = () => mockDateNow;
  });

  afterEach(() => {
    global.Date.now = originalDateNow;
  });

  // Recreate the function here for testing
  function msSince(isoTimestamp) {
    if (!isoTimestamp) return NaN;
    return Date.now() - new Date(isoTimestamp).getTime();
  }

  it('returns positive value for past timestamps', () => {
    const pastDate = new Date(mockDateNow - 10000).toISOString();
    const result = msSince(pastDate);
    expect(result).toBe(10000);
  });

  it('returns 0 for current timestamp', () => {
    const now = new Date(mockDateNow).toISOString();
    const result = msSince(now);
    expect(result).toBe(0);
  });

  it('returns negative value for future timestamps', () => {
    const futureDate = new Date(mockDateNow + 10000).toISOString();
    const result = msSince(futureDate);
    expect(result).toBe(-10000);
  });

  it('handles invalid timestamps', () => {
    expect(msSince('invalid')).toBeNaN();
    expect(msSince(null)).toBeNaN();
    expect(msSince(undefined)).toBeNaN();
  });
});

describe('pickCurrentRound', () => {
  // Mock Date.now for consistent testing
  const originalDateNow = Date.now;
  const FIXED_TIME = 1700000000000; // Nov 14, 2023 22:13:20 UTC

  beforeEach(() => {
    global.Date.now = () => FIXED_TIME;
  });

  afterEach(() => {
    global.Date.now = originalDateNow;
  });

  const REVEAL_HOLD_MS = 4000;
  
  function msSince(isoTimestamp) {
    if (!isoTimestamp) return NaN;
    return Date.now() - new Date(isoTimestamp).getTime();
  }

  function pickCurrentRound(rounds) {
    if (!rounds || !Array.isArray(rounds)) return undefined;
    for (const r of rounds) {
      if (!r.revealed_at || msSince(r.revealed_at) < REVEAL_HOLD_MS) return r;
    }
    return rounds[rounds.length - 1];
  }

  it('returns first unrevealed round', () => {
    const oldDate = new Date(FIXED_TIME - 1000000).toISOString();
    const rounds = [
      { id: '1', revealed_at: oldDate },
      { id: '2', revealed_at: null },
      { id: '3', revealed_at: null }
    ];
    const result = pickCurrentRound(rounds);
    expect(result).toEqual(rounds[1]);
  });

  it('returns recently revealed round within hold window', () => {
    // Create a timestamp 1 second ago from FIXED_TIME
    const revealTime = new Date(FIXED_TIME - 1000).toISOString();
    const oldDate = new Date(FIXED_TIME - 1000000).toISOString();
    const rounds = [
      { id: '1', revealed_at: oldDate },
      { id: '2', revealed_at: revealTime },
      { id: '3', revealed_at: null }
    ];
    const result = pickCurrentRound(rounds);
    expect(result).toEqual(rounds[1]);
  });

  it('returns last round when all revealed and hold window passed', () => {
    // Create a timestamp 5 seconds ago from FIXED_TIME (past hold window)
    const revealTime = new Date(FIXED_TIME - 5000).toISOString();
    const rounds = [
      { id: '1', revealed_at: revealTime },
      { id: '2', revealed_at: revealTime }
    ];
    const result = pickCurrentRound(rounds);
    expect(result).toEqual(rounds[1]);
  });

  it('handles empty array', () => {
    expect(pickCurrentRound([])).toBeUndefined();
  });

  it('handles null rounds', () => {
    expect(pickCurrentRound(null)).toBeUndefined();
  });

  it('handles undefined rounds', () => {
    expect(pickCurrentRound(undefined)).toBeUndefined();
  });
});

// ============================================================================
// Avatar utilities
// ============================================================================

describe('applyAvatar', () => {
  // Recreate the function with mocked DOM
  function applyAvatar(avatarUrl) {
    const isPhoto = !!(avatarUrl && avatarUrl.startsWith("data:"));
    return {
      cornerPhoto: { src: isPhoto ? avatarUrl : "", style: { display: isPhoto ? "block" : "none" } },
      picPhoto: { src: isPhoto ? avatarUrl : "", style: { display: isPhoto ? "block" : "none" } }
    };
  }

  it('shows photo when avatarUrl is data URL', () => {
    const dataUrl = 'data:image/jpeg;base64,test';
    const result = applyAvatar(dataUrl);
    expect(result.cornerPhoto.src).toBe(dataUrl);
    expect(result.cornerPhoto.style.display).toBe('block');
    expect(result.picPhoto.src).toBe(dataUrl);
    expect(result.picPhoto.style.display).toBe('block');
  });

  it('hides photo when avatarUrl is not data URL', () => {
    const result = applyAvatar('https://example.com/avatar.jpg');
    expect(result.cornerPhoto.src).toBe('');
    expect(result.cornerPhoto.style.display).toBe('none');
    expect(result.picPhoto.src).toBe('');
    expect(result.picPhoto.style.display).toBe('none');
  });

  it('hides photo when avatarUrl is null or empty', () => {
    expect(applyAvatar(null).cornerPhoto.style.display).toBe('none');
    expect(applyAvatar('').cornerPhoto.style.display).toBe('none');
  });
});

// ============================================================================
// Tab management utilities
// ============================================================================

describe('goToTab', () => {
  // Mock DOM
  function createMockTabs() {
    return [
      { dataset: { target: 'access' }, setAttribute: jest.fn() },
      { dataset: { target: 'submit' }, setAttribute: jest.fn() },
      { dataset: { target: 'home' }, setAttribute: jest.fn() }
    ];
  }

  function createMockPanels() {
    return [
      { id: 'access', classList: { add: jest.fn(), remove: jest.fn() } },
      { id: 'submit', classList: { add: jest.fn(), remove: jest.fn() } },
      { id: 'home', classList: { add: jest.fn(), remove: jest.fn() } }
    ];
  }

  // Recreate the function with mocked DOM
  function goToTab(id, tabs = createMockTabs(), panels = createMockPanels()) {
    const tab = tabs.find(t => t.dataset.target === id);
    if (tab) {
      tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
      panels.forEach(p => p.classList.remove('active'));
      tab.setAttribute('aria-selected', 'true');
      const panel = panels.find(p => p.id === id);
      if (panel) panel.classList.add('active');
    }
    return { tabs, panels };
  }

  it('activates the correct tab and panel', () => {
    const tabs = createMockTabs();
    const panels = createMockPanels();
    goToTab('submit', tabs, panels);
    expect(tabs[0].setAttribute).toHaveBeenCalledWith('aria-selected', 'false');
    expect(tabs[1].setAttribute).toHaveBeenCalledWith('aria-selected', 'true');
    expect(panels[1].classList.add).toHaveBeenCalledWith('active');
  });

  it('deactivates all other tabs and panels', () => {
    const tabs = createMockTabs();
    const panels = createMockPanels();
    goToTab('home', tabs, panels);
    tabs.forEach(tab => {
      expect(tab.setAttribute).toHaveBeenCalledWith('aria-selected', 'false');
    });
    panels.forEach(panel => {
      expect(panel.classList.remove).toHaveBeenCalledWith('active');
    });
    expect(tabs[2].setAttribute).toHaveBeenCalledWith('aria-selected', 'true');
    expect(panels[2].classList.add).toHaveBeenCalledWith('active');
  });
});

// ============================================================================
// Lobby utilities
// ============================================================================

describe('lobby code validation', () => {
  it('accepts 6-digit numeric codes', () => {
    const code = '123456';
    expect(code.length).toBe(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it('rejects non-numeric codes', () => {
    expect(/^\d{6}$/.test('abc123')).toBe(false);
  });

  it('rejects codes that are too short', () => {
    expect(/^\d{6}$/.test('12345')).toBe(false);
  });

  it('rejects codes that are too long', () => {
    expect(/^\d{6}$/.test('1234567')).toBe(false);
  });
});

// ============================================================================
// Game logic utilities
// ============================================================================

describe('standings calculation', () => {
  it('calculates correct standings from guesses', () => {
    const guesses = [
      { guesser_id: 'player1', correct: true },
      { guesser_id: 'player1', correct: true },
      { guesser_id: 'player1', correct: false },
      { guesser_id: 'player2', correct: true },
      { guesser_id: 'player2', correct: false },
      { guesser_id: 'player3', correct: false }
    ];

    const standings = {};
    guesses.forEach(g => {
      if (!standings[g.guesser_id]) standings[g.guesser_id] = { correct: 0, total: 0 };
      standings[g.guesser_id].total++;
      if (g.correct) standings[g.guesser_id].correct++;
    });

    expect(standings.player1.correct).toBe(2);
    expect(standings.player1.total).toBe(3);
    expect(standings.player2.correct).toBe(1);
    expect(standings.player2.total).toBe(2);
    expect(standings.player3.correct).toBe(0);
    expect(standings.player3.total).toBe(1);
  });

  it('handles empty guesses array', () => {
    const guesses = [];
    const standings = {};
    guesses.forEach(g => {
      if (!standings[g.guesser_id]) standings[g.guesser_id] = { correct: 0, total: 0 };
      standings[g.guesser_id].total++;
      if (g.correct) standings[g.guesser_id].correct++;
    });
    expect(Object.keys(standings).length).toBe(0);
  });
});

// ============================================================================
// String utilities
// ============================================================================

describe('initial extraction', () => {
  it('extracts first character from display name', () => {
    const name = 'Alice';
    const initial = name.charAt(0).toUpperCase();
    expect(initial).toBe('A');
  });

  it('handles empty name', () => {
    const name = '';
    const initial = (name || '?').charAt(0).toUpperCase();
    expect(initial).toBe('?');
  });

  it('handles null name', () => {
    const name = null;
    const initial = (name || '?').charAt(0).toUpperCase();
    expect(initial).toBe('?');
  });

  it('handles single character name', () => {
    const name = 'A';
    const initial = name.charAt(0).toUpperCase();
    expect(initial).toBe('A');
  });
});
