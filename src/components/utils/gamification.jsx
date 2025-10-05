
import { gamificationStore, broadcastGamificationUpdate, calculateLevel, calculateRank } from "./gamificationStore";
import { useEffect } from "react";

/**
 * Record a daily check-in - SERVER-BACKED VERSION
 * Calls the backend function which handles all point calculation and streak logic
 */
export async function recordCheckIn(userEmail, payload) {
  try {
    const res = await fetch('/functions/recordCheckIn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood: payload.mood,
        mood_emoji: payload.mood_emoji,
        habits_completed: payload.habits_completed || [],
        notes: payload.notes || ""
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    
    // Update local store
    gamificationStore.set({
      points: data.totalPoints,
      streak: data.currentStreak,
      level: data.level,
      rank: calculateRank(data.totalPoints)
    });

    // Broadcast so Dashboard reloads
    broadcastGamificationUpdate({
      type: 'checkin_completed',
      checkInId: data.checkInId,
      points: data.totalPoints,
      streak: data.currentStreak,
      longestStreak: data.longestStreak,
      level: data.level
    });

    return { 
      success: true, 
      checkInId: data.checkInId,
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      totalPoints: data.totalPoints,
      level: data.level,
      pointsEarned: data.totalPoints // For display
    };
  } catch (error) {
    console.error('recordCheckIn failed', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Complete a goal - SERVER-BACKED VERSION
 */
export async function completeGoal(goalId, userEmail) {
  try {
    const res = await fetch('/functions/goals/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        goal_id: goalId, 
        completed: true 
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    
    // Update local store
    if (data.stats) {
      gamificationStore.set({
        points: data.stats.totalPoints,
        streak: data.stats.currentStreak,
        level: data.stats.level,
        rank: calculateRank(data.stats.totalPoints)
      });

      // Broadcast update
      broadcastGamificationUpdate({
        type: 'goal_completed',
        goalId,
        points: data.stats.totalPoints,
        streak: data.stats.currentStreak,
        level: data.stats.level
      });
    }

    return {
      success: true,
      pointsEarned: 20,
      totalPoints: data.stats?.totalPoints || 0,
      currentStreak: data.stats?.currentStreak || 0
    };
  } catch (error) {
    console.error('completeGoal failed', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Toggle goal completion status
 */
export async function toggleGoalCompletion(goalId, currentlyCompleted, userEmail) {
  try {
    const res = await fetch('/functions/goals/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        goal_id: goalId, 
        completed: !currentlyCompleted 
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    
    // Update local store
    if (data.stats) {
      gamificationStore.set({
        points: data.stats.totalPoints,
        streak: data.stats.currentStreak,
        level: data.stats.level,
        rank: calculateRank(data.stats.totalPoints)
      });

      // Broadcast update
      broadcastGamificationUpdate({
        type: currentlyCompleted ? 'goal_uncompleted' : 'goal_completed',
        goalId,
        points: data.stats.totalPoints,
        streak: data.stats.currentStreak,
        level: data.stats.level
      });
    }

    return { success: true, stats: data.stats };
  } catch (error) {
    console.error('toggleGoalCompletion failed', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Fetch user stats from server
 */
export async function fetchUserStats() {
  try {
    const res = await fetch('/functions/user/stats');
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    
    // Update local store
    gamificationStore.set({
      points: data.totalPoints,
      streak: data.currentStreak,
      level: data.level,
      rank: calculateRank(data.totalPoints)
    });

    return {
      email: data.email,
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      totalPoints: data.totalPoints,
      level: data.level
    };
  } catch (error) {
    console.error('fetchUserStats failed', error);
    return null;
  }
}

/**
 * Fetch app configuration (plan limits, etc.) with fallback
 */
export async function fetchConfig() {
  try {
    const res = await fetch('/functions/config');
    
    // If endpoint doesn't exist (404), return default config
    if (res.status === 404) {
      console.warn('Config endpoint not available, using defaults');
      return await getDefaultConfig();
    }
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    // Check if response is actually JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Non-JSON config response, using defaults');
      return await getDefaultConfig();
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('fetchConfig failed', error);
    return await getDefaultConfig();
  }
}

/**
 * Get default configuration based on user's plan
 */
async function getDefaultConfig() {
  try {
    const { User } = await import('@/api/entities');
    const { UserProfile } = await import('@/api/entities');
    
    const user = await User.me();
    
    // Handle case where user is not logged in or cannot be fetched
    if (!user || !user.email) {
      return { plan: 'LITE', habitCap: 5, dailyGoalTarget: 0 };
    }

    const profiles = await UserProfile.filter({ created_by: user.email });
    
    const plan = profiles.length > 0 ? (profiles[0].plan || 'lite') : 'lite';
    const habitCap = plan.toLowerCase() === 'lite' ? 5 : 999;
    const dailyGoalTarget = profiles.length > 0 ? (profiles[0].daily_goal_target || 0) : 0;
    
    return {
      plan: plan.toUpperCase(),
      habitCap,
      dailyGoalTarget
    };
  } catch (error) {
    console.error('Failed to get default config', error);
    // Return safe defaults if everything fails
    return {
      plan: 'LITE',
      habitCap: 5,
      dailyGoalTarget: 0
    };
  }
}

/**
 * Get current challenge with fallback
 */
export async function getCurrentChallenge() {
  try {
    const res = await fetch('/functions/challenges/current');
    
    if (res.status === 404) {
      console.warn('Challenges endpoint not available');
      return null;
    }
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    // Check if response is actually JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Non-JSON challenge response');
      return null;
    }

    const data = await res.json();
    return data.challenge;
  } catch (error) {
    console.error('getCurrentChallenge failed', error);
    return null;
  }
}

/**
 * Join a challenge with error handling
 */
export async function joinChallenge(challengeId) {
  try {
    const res = await fetch('/functions/challenges/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId })
    });
    
    if (res.status === 404) {
      return { success: false, error: 'Challenge endpoint not available' };
    }
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    
    // Update local store with new stats if provided
    if (data.stats) {
      gamificationStore.set({
        points: data.stats.totalPoints,
        streak: data.stats.currentStreak,
        level: data.stats.level,
        rank: calculateRank(data.stats.totalPoints)
      });
      
      broadcastGamificationUpdate({
        type: 'challenge_joined',
        challengeId,
        ...data.stats
      });
    }
    
    return { success: true, ...data };
  } catch (error) {
    console.error('joinChallenge failed', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get my challenge progress with fallback
 */
export async function getMyChallengeProgress() {
  try {
    const res = await fetch('/functions/challenges/my-progress');
    
    if (res.status === 404) {
      console.warn('Challenge progress endpoint not available');
      return [];
    }
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Non-JSON challenge progress response');
      return [];
    }

    const data = await res.json();
    return data.enrollments || [];
  } catch (error) {
    console.error('getMyChallengeProgress failed', error);
    return [];
  }
}

/**
 * Get leaderboard with fallback
 */
export async function getLeaderboard() {
  try {
    const res = await fetch('/functions/community/leaderboard');
    
    if (res.status === 404) {
      console.warn('Leaderboard endpoint not available');
      return [];
    }
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Non-JSON leaderboard response');
      return [];
    }

    const data = await res.json();
    return data.leaderboard || [];
  } catch (error) {
    console.error('getLeaderboard failed', error);
    return [];
  }
}

/**
 * Get forum posts with fallback
 */
export async function getForumPosts(category = 'general') {
  try {
    const res = await fetch(`/functions/forums/list?category=${category}`);
    
    if (res.status === 404) {
      console.warn('Forums endpoint not available');
      return [];
    }
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Non-JSON forum response');
      return [];
    }

    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error('getForumPosts failed', error);
    return [];
  }
}

/**
 * Create forum post with error handling
 */
export async function createForumPost(category, content) {
  try {
    const res = await fetch('/functions/forums/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, content })
    });
    
    if (res.status === 404) {
      return { success: false, error: 'Forum endpoint not available' };
    }
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { success: true, ...data };
  } catch (error) {
    console.error('createForumPost failed', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get progress by focus area - with client-side fallback
 */
export async function getFocusAreaProgress() {
  try {
    const res = await fetch('/functions/progress/focus-areas');
    
    // If endpoint doesn't exist (404), fall back to client-side calculation
    if (res.status === 404) {
      console.warn('Server endpoint not available for focus area progress, using client-side calculation');
      return await calculateFocusAreaProgressClientSide();
    }
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    // Check if response is actually JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Non-JSON response received for focus area progress, using client-side calculation');
      return await calculateFocusAreaProgressClientSide();
    }

    const data = await res.json();
    
    // Dispatch event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('focusareas:update', { detail: data }));
    }
    
    return data.areas || [];
  } catch (error) {
    console.error('getFocusAreaProgress failed', error);
    // Fallback to client-side calculation
    return await calculateFocusAreaProgressClientSide();
  }
}

/**
 * Client-side fallback calculation for focus area progress
 */
async function calculateFocusAreaProgressClientSide() {
  try {
    const { Goal } = await import('@/api/entities');
    const { Habit } = await import('@/api/entities');
    const { DailyCheckIn } = await import('@/api/entities');
    const { User } = await import('@/api/entities');
    
    const user = await User.me();
    const today = new Date().toISOString().slice(0, 10);
    
    // Define focus areas
    const areas = ['happiness', 'fitness', 'focus', 'relationships', 'health', 'mindset', 'productivity', 'sleep', 'learning', 'creativity'];
    
    // Get all user data - FIX: Filter for active habits only
    const [allGoals, allActiveHabits, todayCheckIn] = await Promise.all([
      Goal.filter({ created_by: user?.email }), // Use optional chaining for user?.email
      Habit.filter({ created_by: user?.email, is_active: true }), // Use optional chaining for user?.email
      DailyCheckIn.filter({ created_by: user?.email, date: today }) // Use optional chaining for user?.email
    ]);
    
    const habitsCompletedToday = todayCheckIn.length > 0 ? (todayCheckIn[0].habits_completed || []) : [];
    
    // Calculate stats per area
    const areaStats = areas.map(area => {
      // Goals for this area
      const areaGoals = allGoals.filter(g => 
        (g.category && g.category.toLowerCase() === area) ||
        (g.focus_area && g.focus_area.toLowerCase() === area)
      );
      const goalsTotal = areaGoals.length;
      const goalsCompleted = areaGoals.filter(g => g.completed).length;
      
      // Habits for this area (already filtered for active)
      const areaHabits = allActiveHabits.filter(h => 
        (h.category && h.category.toLowerCase() === area) ||
        (h.focus_area && h.focus_area.toLowerCase() === area)
      );
      const habitsActive = areaHabits.length;
      
      // Habits completed today for this area
      const areaHabitIds = areaHabits.map(h => h.id);
      const habitsCompletedTodayCount = habitsCompletedToday.filter(id => 
        areaHabitIds.includes(id)
      ).length;
      
      const percentGoalsCompleted = goalsTotal > 0 
        ? Math.round((goalsCompleted / goalsTotal) * 100) 
        : 0;
      
      return {
        area,
        goals_total: goalsTotal,
        goals_completed: goalsCompleted,
        habits_active: habitsActive,
        habits_completed_today: habitsCompletedTodayCount,
        percent_goals_completed: percentGoalsCompleted
      };
    }).filter(stat => stat.goals_total > 0 || stat.habits_active > 0); // Only include areas with data
    
    return areaStats;
  } catch (error) {
    console.error('Client-side focus area calculation failed', error);
    return [];
  }
}

/**
 * Hook to listen for focus area updates
 */
export function useFocusAreaUpdates(callback) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUpdate = (event) => {
      if (callback && event.detail) {
        callback(event.detail);
      }
    };

    window.addEventListener('focusareas:update', handleUpdate);
    return () => window.removeEventListener('focusareas:update', handleUpdate);
  }, [callback]);
}

/**
 * Hook to listen for gamification updates
 */
export function useGamificationUpdates(callback) {
  useEffect(() => {
    if (typeof window === 'undefined' || !callback) return;

    const handleUpdate = (event) => {
      if (callback && event.detail) {
        callback(event.detail);
      }
    };

    window.addEventListener('gamification:update', handleUpdate);
    return () => window.removeEventListener('gamification:update', handleUpdate);
  }, [callback]);
}
