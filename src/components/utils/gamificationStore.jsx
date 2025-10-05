/**
 * Gamification Store - Centralized state management for gamification data
 * Provides reactive updates across all components
 */

const initialState = {
  points: 0,
  streak: 0,
  journeyStatus: 'ON_TRACK', // 'ON_TRACK' | 'BEHIND' | 'AHEAD'
  level: 1,
  rank: 'Beginner'
};

export const gamificationStore = (() => {
  let state = { ...initialState };
  const listeners = new Set();

  /**
   * Update state and notify listeners
   */
  function set(patch) {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener(state));
  }

  /**
   * Get current state
   */
  function get() {
    return state;
  }

  /**
   * Subscribe to state changes
   * @param {Function} fn - Callback function
   * @returns {Function} Unsubscribe function
   */
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  /**
   * Reset state to initial values
   */
  function reset() {
    set(initialState);
  }

  // Listen to global gamification update events
  if (typeof window !== 'undefined') {
    window.addEventListener('gamification:update', (event) => {
      if (event.detail) {
        set(event.detail);
      }
    });

    // Listen to profile updates
    window.addEventListener('user:profile:updated', (event) => {
      if (event.detail) {
        const { points, streak, level, rank } = event.detail;
        set({ points, streak, level, rank });
      }
    });
  }

  return { get, set, subscribe, reset };
})();

/**
 * Broadcast gamification update to all listeners
 * @param {Object} data - Gamification data to broadcast
 */
export function broadcastGamificationUpdate(data) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gamification:update', {
      detail: data
    }));
  }
}

/**
 * Calculate level from points
 */
export function calculateLevel(points) {
  if (points >= 10000) return 10;
  if (points >= 5000) return 9;
  if (points >= 2500) return 8;
  if (points >= 1000) return 7;
  if (points >= 500) return 6;
  if (points >= 250) return 5;
  if (points >= 100) return 4;
  if (points >= 50) return 3;
  if (points >= 25) return 2;
  return 1;
}

/**
 * Calculate rank from points
 */
export function calculateRank(points) {
  if (points >= 10000) return 'Immortal';
  if (points >= 5000) return 'Legend';
  if (points >= 2500) return 'Master';
  if (points >= 1000) return 'Champion';
  if (points >= 500) return 'Achiever';
  if (points >= 100) return 'Explorer';
  return 'Beginner';
}

/**
 * Calculate journey status based on expected progress
 * @param {number} streak - Current streak
 * @param {number} daysSinceStart - Days since user started
 * @returns {'ON_TRACK' | 'AHEAD' | 'BEHIND'}
 */
export function calculateJourneyStatus(streak, daysSinceStart) {
  if (daysSinceStart === 0) return 'ON_TRACK';
  
  const expectedStreak = Math.floor(daysSinceStart * 0.7); // Expect 70% consistency
  
  if (streak >= daysSinceStart * 0.9) return 'AHEAD';
  if (streak < expectedStreak) return 'BEHIND';
  return 'ON_TRACK';
}