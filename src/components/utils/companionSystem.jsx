/**
 * Companion System Client Utilities
 * Connects to the comprehensive backend companion endpoints
 */

/**
 * Get companion state with all details
 */
export async function getCompanionState() {
  try {
    const res = await fetch('/functions/companion/state');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    return {
      success: true,
      companion: data.companion,
      badges: data.badges || [],
      freezes: data.streak_freezes || 0,
      plan: data.plan || 'LITE',
      discoveryEnabled: data.discovery_enabled || false,
      accessibility: data.accessibility || {},
      season: data.season
    };
  } catch (error) {
    console.error('getCompanionState failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Select a companion family
 * Families: creature, plant, robot, animal, mascot (seasonal), hero (seasonal)
 */
export async function selectCompanion(family) {
  try {
    const res = await fetch('/functions/companion/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ family })
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}`, code: err.code };
    }
    
    const data = await res.json();
    
    // Broadcast update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('companion:selected', { detail: data }));
    }
    
    return { success: true, companion: data.companion, season: data.season };
  } catch (error) {
    console.error('selectCompanion failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Use a streak freeze for a specific date
 */
export async function useStreakFreeze(date) {
  try {
    const res = await fetch('/functions/companion/use-freeze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }
    
    const data = await res.json();
    
    // Broadcast update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('streak:freeze:used', { detail: data }));
    }
    
    return { success: true, usedFor: data.usedFor, stats: data.stats };
  } catch (error) {
    console.error('useStreakFreeze failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Award XP and coins manually
 */
export async function awardXP(payload = {}) {
  try {
    const res = await fetch('/functions/xp/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    // Broadcast update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xp:awarded', { detail: data }));
    }
    
    return { success: true, ...data };
  } catch (error) {
    console.error('awardXP failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get list of user's badges
 */
export async function getBadges() {
  try {
    const res = await fetch('/functions/badges/list');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    return { success: true, badges: data.badges || [] };
  } catch (error) {
    console.error('getBadges failed', error);
    return { success: false, error: error.message, badges: [] };
  }
}

/**
 * Award a badge to user (one-time only)
 */
export async function awardBadge(key) {
  try {
    const res = await fetch('/functions/badges/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    if (data.success && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('badge:awarded', { detail: { key } }));
    }
    
    return { success: data.success };
  } catch (error) {
    console.error('awardBadge failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Increment journal tally (privacy-friendly)
 */
export async function incrementJournalTally(count = 1) {
  try {
    const res = await fetch('/functions/journal/tally', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    return { success: true, tally: data.tally };
  } catch (error) {
    console.error('incrementJournalTally failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get feature flags and config
 */
export async function getFlags() {
  try {
    const res = await fetch('/functions/config/flags');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    return {
      success: true,
      seasonalsEnabled: data.seasonals_enabled || false,
      questsEnabled: data.quests_enabled || false,
      communityEnabled: data.community_enabled || false,
      storeEnabled: data.store_enabled || false,
      accessibility: data.accessibility_defaults || {},
      notifications: data.notifications || {}
    };
  } catch (error) {
    console.error('getFlags failed', error);
    return {
      success: false,
      seasonalsEnabled: false,
      questsEnabled: false,
      communityEnabled: true,
      storeEnabled: false
    };
  }
}

/**
 * Get social configuration
 */
export async function getSocialConfig() {
  try {
    const res = await fetch('/functions/social/config');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    return {
      success: true,
      discoveryEnabled: data.discovery_enabled || false,
      leaderboardsOptIn: data.leaderboards_opt_in || false
    };
  } catch (error) {
    console.error('getSocialConfig failed', error);
    return { success: false, discoveryEnabled: false, leaderboardsOptIn: false };
  }
}

/**
 * Toggle social discovery
 */
export async function toggleDiscovery(enabled) {
  try {
    const res = await fetch('/functions/social/discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('social:discovery:changed', { 
        detail: { enabled: data.discovery_enabled } 
      }));
    }
    
    return { success: true, discoveryEnabled: data.discovery_enabled };
  } catch (error) {
    console.error('toggleDiscovery failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Evolution tiers for display
 */
export const EVOLUTION_TIERS = [
  { tier: 0, name: "Starter", xpRequired: 0, emoji: "🥚" },
  { tier: 1, name: "Growing", xpRequired: 100, emoji: "🌱" },
  { tier: 2, name: "Developing", xpRequired: 300, emoji: "🌿" },
  { tier: 3, name: "Advanced", xpRequired: 700, emoji: "🌳" },
  { tier: 4, name: "Legendary", xpRequired: 1500, emoji: "✨" }
];

/**
 * Companion families
 */
export const COMPANION_FAMILIES = [
  { id: "creature", name: "Creature", emoji: "🐉", seasonal: false },
  { id: "plant", name: "Plant", emoji: "🌺", seasonal: false },
  { id: "robot", name: "Robot", emoji: "🤖", seasonal: false },
  { id: "animal", name: "Animal", emoji: "🦊", seasonal: false },
  { id: "mascot", name: "Mascot", emoji: "🎭", seasonal: true },
  { id: "hero", name: "Hero", emoji: "🦸", seasonal: true }
];