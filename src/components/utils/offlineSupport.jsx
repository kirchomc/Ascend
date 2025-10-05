/**
 * Offline Support Utilities
 * Enables key features to work without internet connection
 */

const CACHE_VERSION = 'ascend-v1';
const OFFLINE_CACHE_KEYS = [
  'dashboard-data',
  'user-profile',
  'check-ins',
  'goals',
  'habits',
  'journal-entries',
  'challenges-joined',
  'points-total'
];

/**
 * Cache data for offline access
 */
export async function cacheForOffline(key, data) {
  try {
    if (typeof localStorage === 'undefined') return;
    const cacheKey = `${CACHE_VERSION}-${key}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    }));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

/**
 * Retrieve cached data for offline use
 */
export async function getFromCache(key, maxAge = 1000 * 60 * 60 * 24) { // 24 hours default
  try {
    if (typeof localStorage === 'undefined') return null;
    const cacheKey = `${CACHE_VERSION}-${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp, version } = JSON.parse(cached);
    
    // Check if cache is still valid
    if (version !== CACHE_VERSION || Date.now() - timestamp > maxAge) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('Failed to get cached data:', error);
    return null;
  }
}

/**
 * Check if user is online
 */
export function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Queue action for when back online
 */
export function queueForSync(action) {
  try {
    if (typeof localStorage === 'undefined') return;
    const queue = JSON.parse(localStorage.getItem('sync-queue') || '[]');
    queue.push({
      ...action,
      queuedAt: Date.now()
    });
    localStorage.setItem('sync-queue', JSON.stringify(queue));
  } catch (error) {
    console.warn('Failed to queue sync action:', error);
  }
}

/**
 * Process queued actions when back online
 */
export async function processSyncQueue() {
  try {
    if (!isOnline() || typeof localStorage === 'undefined') return;
    
    const queue = JSON.parse(localStorage.getItem('sync-queue') || '[]');
    if (queue.length === 0) return;
    
    console.log(`Processing ${queue.length} queued actions...`);
    
    for (const action of queue) {
      try {
        // Process based on action type
        if (action.type === 'check-in') {
          await fetch('/functions/recordCheckIn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
        } else if (action.type === 'goal-update') {
          await fetch('/functions/goals/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
        }
        // Add more action types as needed
      } catch (error) {
        console.error('Failed to process queued action:', error);
        // Keep action in queue if it failed
        continue;
      }
    }
    
    // Clear processed queue
    localStorage.setItem('sync-queue', '[]');
    console.log('Sync queue processed successfully');
    
  } catch (error) {
    console.warn('Failed to process sync queue:', error);
  }
}

/**
 * Listen for online/offline status changes
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online - processing queued actions');
    processSyncQueue();
  });
  
  window.addEventListener('offline', () => {
    console.log('Gone offline - will queue changes');
  });
}

/**
 * Features that work offline
 */
export const OFFLINE_FEATURES = [
  'Dashboard',
  'Streaks',
  'Check-In',
  'Goals',
  'Journal',
  'Profile',
  'Individual Challenges',
  'Active Goals',
  'Personal Challenges',
  'Point Totals'
];

/**
 * Features that require internet
 */
export const ONLINE_ONLY_FEATURES = [
  'Library',
  'Community Forums',
  'Leaderboard',
  'Recent Posts',
  'Share Thoughts',
  'All Challenges'
];