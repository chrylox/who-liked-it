/**
 * Unit tests for game logic in Who Liked It?
 */

describe('Game Logic', () => {
  const REVEAL_HOLD_MS = 4000;

  // Mock Date.now for consistent testing
  const originalDateNow = Date.now;
  const FIXED_TIME = 1700000000000; // Nov 14, 2023 22:13:20 UTC

  beforeEach(() => {
    global.Date.now = () => FIXED_TIME;
  });

  afterEach(() => {
    global.Date.now = originalDateNow;
  });

  function msSince(isoTimestamp) {
    if (!isoTimestamp) return NaN;
    return Date.now() - new Date(isoTimestamp).getTime();
  }

  describe('pickCurrentRound', () => {
    function pickCurrentRound(rounds) {
      if (!rounds || !Array.isArray(rounds)) return undefined;
      for (const r of rounds) {
        if (!r.revealed_at || msSince(r.revealed_at) < REVEAL_HOLD_MS) return r;
      }
      return rounds[rounds.length - 1];
    }

    it('returns first unrevealed round', () => {
      // Use dates relative to FIXED_TIME
      const oldDate = new Date(FIXED_TIME - 1000000).toISOString(); // Far in the past
      const rounds = [
        { id: '1', round_number: 1, revealed_at: oldDate },
        { id: '2', round_number: 2, revealed_at: null },
        { id: '3', round_number: 3, revealed_at: null }
      ];
      const result = pickCurrentRound(rounds);
      expect(result).toEqual(rounds[1]);
    });

    it('returns recently revealed round within hold window', () => {
      // Create a timestamp 1 second ago from FIXED_TIME
      const revealTime = new Date(FIXED_TIME - 1000).toISOString();
      const oldDate = new Date(FIXED_TIME - 1000000).toISOString(); // Far in the past
      const rounds = [
        { id: '1', round_number: 1, revealed_at: oldDate },
        { id: '2', round_number: 2, revealed_at: revealTime },
        { id: '3', round_number: 3, revealed_at: null }
      ];
      const result = pickCurrentRound(rounds);
      expect(result).toEqual(rounds[1]);
    });

    it('returns last round when all revealed and hold window passed', () => {
      // Create a timestamp 5 seconds ago from FIXED_TIME (past hold window)
      const revealTime = new Date(FIXED_TIME - 5000).toISOString();
      const rounds = [
        { id: '1', round_number: 1, revealed_at: revealTime },
        { id: '2', round_number: 2, revealed_at: revealTime }
      ];
      const result = pickCurrentRound(rounds);
      expect(result).toEqual(rounds[1]);
    });

    it('returns first round when it is the only unrevealed one', () => {
      const oldDate = new Date(FIXED_TIME - 1000000).toISOString();
      const rounds = [
        { id: '1', round_number: 1, revealed_at: null },
        { id: '2', round_number: 2, revealed_at: oldDate }
      ];
      const result = pickCurrentRound(rounds);
      expect(result).toEqual(rounds[0]);
    });

    it('handles empty rounds array', () => {
      expect(pickCurrentRound([])).toBeUndefined();
    });

    it('handles null rounds', () => {
      expect(pickCurrentRound(null)).toBeUndefined();
    });

    it('handles undefined rounds', () => {
      expect(pickCurrentRound(undefined)).toBeUndefined();
    });
  });

  describe('msSince', () => {
    it('returns positive value for past timestamps', () => {
      const pastDate = new Date(FIXED_TIME - 10000).toISOString();
      const result = msSince(pastDate);
      expect(result).toBe(10000);
    });

    it('returns 0 for current timestamp', () => {
      const now = new Date(FIXED_TIME).toISOString();
      const result = msSince(now);
      expect(result).toBe(0);
    });

    it('returns negative value for future timestamps', () => {
      const futureDate = new Date(FIXED_TIME + 10000).toISOString();
      const result = msSince(futureDate);
      expect(result).toBe(-10000);
    });

    it('handles ISO timestamps with milliseconds', () => {
      const pastDate = new Date(FIXED_TIME - 5000).toISOString();
      const result = msSince(pastDate);
      expect(result).toBe(5000);
    });

    it('handles invalid timestamps', () => {
      expect(msSince('invalid')).toBeNaN();
      expect(msSince(null)).toBeNaN();
      expect(msSince(undefined)).toBeNaN();
    });
  });

  describe('Game State Management', () => {
    it('determines if round is guessable', () => {
      const round = {
        id: '1',
        is_my_video: false,
        revealed_at: null,
        guesses: []
      };
      const myUserId = 'player1';

      // Round is guessable if: not my video, not revealed, and I haven't guessed
      const isGuessable = !round.is_my_video && !round.revealed_at && 
        !round.guesses.some(g => g.guesser_id === myUserId);

      expect(isGuessable).toBe(true);
    });

    it('determines round is not guessable if it is my video', () => {
      const round = {
        id: '1',
        is_my_video: true,
        revealed_at: null,
        guesses: []
      };
      const myUserId = 'player1';

      const isGuessable = !round.is_my_video && !round.revealed_at && 
        !round.guesses.some(g => g.guesser_id === myUserId);

      expect(isGuessable).toBe(false);
    });

    it('determines round is not guessable if already revealed', () => {
      const round = {
        id: '1',
        is_my_video: false,
        revealed_at: '2024-01-01T00:00:00Z',
        guesses: []
      };
      const myUserId = 'player1';

      const isGuessable = !round.is_my_video && !round.revealed_at && 
        !round.guesses.some(g => g.guesser_id === myUserId);

      expect(isGuessable).toBe(false);
    });

    it('determines round is not guessable if already guessed', () => {
      const round = {
        id: '1',
        is_my_video: false,
        revealed_at: null,
        guesses: [{ guesser_id: 'player1', guessed_user_id: 'player2' }]
      };
      const myUserId = 'player1';

      const isGuessable = !round.is_my_video && !round.revealed_at && 
        !round.guesses.some(g => g.guesser_id === myUserId);

      expect(isGuessable).toBe(false);
    });
  });

  describe('Standings Calculation', () => {
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
        if (!standings[g.guesser_id]) {
          standings[g.guesser_id] = { correct: 0, total: 0, score: 0 };
        }
        standings[g.guesser_id].total++;
        if (g.correct) {
          standings[g.guesser_id].correct++;
          standings[g.guesser_id].score++;
        }
      });

      expect(standings.player1.correct).toBe(2);
      expect(standings.player1.total).toBe(3);
      expect(standings.player1.score).toBe(2);
      expect(standings.player2.correct).toBe(1);
      expect(standings.player2.total).toBe(2);
      expect(standings.player2.score).toBe(1);
      expect(standings.player3.correct).toBe(0);
      expect(standings.player3.total).toBe(1);
      expect(standings.player3.score).toBe(0);
    });

    it('handles empty guesses array', () => {
      const guesses = [];
      const standings = {};
      guesses.forEach(g => {
        if (!standings[g.guesser_id]) {
          standings[g.guesser_id] = { correct: 0, total: 0, score: 0 };
        }
        standings[g.guesser_id].total++;
        if (g.correct) standings[g.guesser_id].correct++;
      });
      expect(Object.keys(standings).length).toBe(0);
    });

    it('sorts players by score descending', () => {
      const standings = {
        player1: { score: 5, correct: 5, total: 6 },
        player2: { score: 3, correct: 3, total: 4 },
        player3: { score: 1, correct: 1, total: 2 }
      };

      const sorted = Object.entries(standings)
        .sort(([, a], [, b]) => b.score - a.score);

      expect(sorted[0][0]).toBe('player1');
      expect(sorted[1][0]).toBe('player2');
      expect(sorted[2][0]).toBe('player3');
    });

    it('handles tied scores', () => {
      const standings = {
        player1: { score: 3, correct: 3, total: 4 },
        player2: { score: 3, correct: 2, total: 3 },
        player3: { score: 2, correct: 2, total: 2 }
      };

      const sorted = Object.entries(standings)
        .sort(([, a], [, b]) => b.score - a.score);

      // Both player1 and player2 have score 3
      expect(sorted[0][1].score).toBe(3);
      expect(sorted[1][1].score).toBe(3);
      expect(sorted[2][1].score).toBe(2);
    });
  });

  describe('Game Progress', () => {
    it('calculates rounds completed', () => {
      const oldDate = new Date(FIXED_TIME - 1000000).toISOString();
      const rounds = [
        { id: '1', revealed_at: oldDate },
        { id: '2', revealed_at: oldDate },
        { id: '3', revealed_at: null }
      ];

      const completed = rounds.filter(r => r.revealed_at).length;
      expect(completed).toBe(2);
    });

    it('calculates rounds remaining', () => {
      const oldDate = new Date(FIXED_TIME - 1000000).toISOString();
      const rounds = [
        { id: '1', revealed_at: oldDate },
        { id: '2', revealed_at: null },
        { id: '3', revealed_at: null }
      ];

      const remaining = rounds.filter(r => !r.revealed_at).length;
      expect(remaining).toBe(2);
    });

    it('determines if game is complete', () => {
      const oldDate = new Date(FIXED_TIME - 1000000).toISOString();
      const rounds = [
        { id: '1', revealed_at: oldDate },
        { id: '2', revealed_at: oldDate }
      ];
      const game = { round_count: 2, rounds };

      const isComplete = game.rounds.every(r => r.revealed_at) && 
        game.rounds.length === game.round_count;

      expect(isComplete).toBe(true);
    });

    it('determines if game is in progress', () => {
      const oldDate = new Date(FIXED_TIME - 1000000).toISOString();
      const rounds = [
        { id: '1', revealed_at: oldDate },
        { id: '2', revealed_at: null }
      ];
      const game = { round_count: 2, rounds, finalized_at: null };

      const isInProgress = !game.finalized_at && 
        game.rounds.some(r => !r.revealed_at);

      expect(isInProgress).toBe(true);
    });
  });

  describe('Lobby State', () => {
    it('determines if lobby is in waiting room', () => {
      const lobby = { game: null };
      const isWaitingRoom = !lobby.game;
      expect(isWaitingRoom).toBe(true);
    });

    it('determines if lobby is in game', () => {
      const lobby = { game: { id: '1', finalized_at: null } };
      const isInGame = lobby.game && !lobby.game.finalized_at;
      expect(isInGame).toBe(true);
    });

    it('determines if lobby game is finalized', () => {
      const oldDate = new Date(FIXED_TIME - 1000000).toISOString();
      const lobby = { game: { id: '1', finalized_at: oldDate } };
      const isFinalized = lobby.game && !!lobby.game.finalized_at;
      expect(isFinalized).toBe(true);
    });

    it('determines if user is organizer', () => {
      const lobby = { organizer_id: 'player1' };
      const currentUserId = 'player1';
      const isOrganizer = lobby.organizer_id === currentUserId;
      expect(isOrganizer).toBe(true);
    });

    it('determines if user is not organizer', () => {
      const lobby = { organizer_id: 'player1' };
      const currentUserId = 'player2';
      const isOrganizer = lobby.organizer_id === currentUserId;
      expect(isOrganizer).toBe(false);
    });
  });

  describe('Video Pool', () => {
    it('filters videos by submitter', () => {
      const posts = [
        { id: '1', video_url: 'url1', submitted_by: { id: 'player1' } },
        { id: '2', video_url: 'url2', submitted_by: { id: 'player2' } },
        { id: '3', video_url: 'url3', submitted_by: { id: 'player1' } }
      ];
      const myUserId = 'player1';

      const myVideos = posts.filter(p => p.submitted_by.id === myUserId);
      expect(myVideos.length).toBe(2);
      expect(myVideos.map(v => v.id)).toEqual(['1', '3']);
    });

    it('checks for duplicate video URLs', () => {
      const posts = [
        { video_url: 'https://tiktok.com/video/123' },
        { video_url: 'https://tiktok.com/video/456' },
        { video_url: 'https://tiktok.com/video/123' }
      ];

      const urls = posts.map(p => p.video_url);
      const uniqueUrls = new Set(urls);
      const hasDuplicates = urls.length !== uniqueUrls.size;

      expect(hasDuplicates).toBe(true);
    });

    it('gets unique video count', () => {
      const posts = [
        { video_url: 'https://tiktok.com/video/123' },
        { video_url: 'https://tiktok.com/video/456' },
        { video_url: 'https://tiktok.com/video/123' }
      ];

      const uniqueUrls = new Set(posts.map(p => p.video_url));
      expect(uniqueUrls.size).toBe(2);
    });
  });
});

describe('Round Management', () => {
  it('determines current round number', () => {
    const oldDate = new Date(1700000000000 - 1000000).toISOString();
    const rounds = [
      { round_number: 1, revealed_at: oldDate },
      { round_number: 2, revealed_at: oldDate },
      { round_number: 3, revealed_at: null }
    ];

    const currentRoundNumber = rounds.find(r => !r.revealed_at)?.round_number || 
      rounds[rounds.length - 1].round_number;

    expect(currentRoundNumber).toBe(3);
  });

  it('determines if all rounds are revealed', () => {
    const oldDate = new Date(1700000000000 - 1000000).toISOString();
    const rounds = [
      { round_number: 1, revealed_at: oldDate },
      { round_number: 2, revealed_at: oldDate }
    ];

    const allRevealed = rounds.every(r => r.revealed_at);
    expect(allRevealed).toBe(true);
  });

  it('finds my guess for a round', () => {
    const round = {
      guesses: [
        { guesser_id: 'player1', guessed_user_id: 'player2' },
        { guesser_id: 'player2', guessed_user_id: 'player3' },
        { guesser_id: 'player3', guessed_user_id: 'player1' }
      ]
    };
    const myUserId = 'player2';

    const myGuess = round.guesses.find(g => g.guesser_id === myUserId);
    expect(myGuess).toEqual({ guesser_id: 'player2', guessed_user_id: 'player3' });
  });

  it('returns undefined if I have not guessed', () => {
    const round = {
      guesses: [
        { guesser_id: 'player1', guessed_user_id: 'player2' },
        { guesser_id: 'player3', guessed_user_id: 'player1' }
      ]
    };
    const myUserId = 'player2';

    const myGuess = round.guesses.find(g => g.guesser_id === myUserId);
    expect(myGuess).toBeUndefined();
  });
});
