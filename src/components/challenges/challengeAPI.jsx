/**
 * Challenge API - Server-backed functions for challenge management
 */

/**
 * Get current active challenge
 */
export async function apiGetCurrentChallenge() {
  try {
    const res = await fetch('/functions/challenges/current');
    if (!res.ok) {
      throw new Error('Failed to load current challenge');
    }
    const json = await res.json();
    return json.challenge; // has fallback if none in DB
  } catch (error) {
    console.error('apiGetCurrentChallenge failed', error);
    // Return a default challenge on error
    return {
      id: "7-day-streak",
      title: "7-Day Streak",
      description: "Check in 7 days in a row",
      duration_days: 7,
      target: 7,
      type: "streak",
      fallback: true
    };
  }
}

/**
 * Join a challenge
 */
export async function apiJoinChallenge(challengeId) {
  try {
    const res = await fetch('/functions/challenges/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId })
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Join failed');
    }
    
    const data = await res.json();
    
    // Dispatch event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('challenge:joined', {
        detail: { challengeId, participationId: data.participation_id }
      }));
    }
    
    return data;
  } catch (error) {
    console.error('apiJoinChallenge failed', error);
    throw error;
  }
}

/**
 * Get user's challenge progress
 */
export async function apiGetMyProgress() {
  try {
    const res = await fetch('/functions/challenges/my-progress');
    
    if (!res.ok) {
      throw new Error('Failed to load progress');
    }
    
    const data = await res.json();
    return data.enrollments || [];
  } catch (error) {
    console.error('apiGetMyProgress failed', error);
    return [];
  }
}

/**
 * Get community leaderboard
 */
export async function apiGetLeaderboard() {
  try {
    const res = await fetch('/functions/community/leaderboard');
    
    if (!res.ok) {
      throw new Error('Failed to load leaderboard');
    }
    
    const data = await res.json();
    return data.leaderboard || [];
  } catch (error) {
    console.error('apiGetLeaderboard failed', error);
    return [];
  }
}