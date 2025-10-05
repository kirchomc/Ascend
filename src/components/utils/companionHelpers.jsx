/**
 * Companion System Helpers
 * Works with backend /functions/companion/* endpoints
 */

export const COMPANION_FAMILIES = [
  { 
    family: "creature", 
    name: "Creature",
    icon: "🐉",
    description: "Mystical beings that grow with your journey",
    starter: "crtr-starter",
    evolutions: ["🥚", "🐛", "🦎", "🐉", "🔮"]
  },
  { 
    family: "plant", 
    name: "Plant",
    icon: "🌱",
    description: "Living plants that bloom as you progress",
    starter: "plnt-starter",
    evolutions: ["🌱", "🌿", "🪴", "🌳", "🌸"]
  },
  { 
    family: "robot", 
    name: "Robot",
    icon: "🤖",
    description: "Tech companions that upgrade over time",
    starter: "robo-starter",
    evolutions: ["⚙️", "🔧", "🤖", "🚀", "🛸"]
  },
  { 
    family: "animal", 
    name: "Animal",
    icon: "🐕",
    description: "Loyal animal friends that grow with you",
    starter: "anim-starter",
    evolutions: ["🐣", "🐥", "🐕", "🦁", "🦄"]
  },
  { 
    family: "mascot", 
    name: "Mascot",
    icon: "🎭",
    description: "Seasonal mascots (unlock during events)",
    starter: "msct-starter",
    seasonal: true,
    evolutions: ["🎃", "🦃", "🎅", "🎆", "🧧"]
  },
  { 
    family: "hero", 
    name: "Hero",
    icon: "🦸",
    description: "Legendary heroes (unlock during events)",
    starter: "hero-starter",
    seasonal: true,
    evolutions: ["👤", "🧑", "🦸‍♂️", "🦸", "⚡"]
  }
];

export const EVOLUTION_TIERS = [
  { tier: 0, xp: 0, name: "Starter" },
  { tier: 1, xp: 100, name: "Budding" },
  { tier: 2, xp: 300, name: "Growing" },
  { tier: 3, xp: 700, name: "Mature" },
  { tier: 4, xp: 1500, name: "Legendary" }
];

export function getCompanionTier(xp) {
  for (let i = EVOLUTION_TIERS.length - 1; i >= 0; i--) {
    if (xp >= EVOLUTION_TIERS[i].xp) {
      return EVOLUTION_TIERS[i];
    }
  }
  return EVOLUTION_TIERS[0];
}

export function getNextTier(currentXP) {
  const currentTier = getCompanionTier(currentXP);
  const nextTierIndex = currentTier.tier + 1;
  
  if (nextTierIndex >= EVOLUTION_TIERS.length) {
    return null; // Max level
  }
  
  const nextTier = EVOLUTION_TIERS[nextTierIndex];
  return {
    ...nextTier,
    xpNeeded: nextTier.xp - currentXP,
    progress: ((currentXP - currentTier.xp) / (nextTier.xp - currentTier.xp)) * 100
  };
}

export function getCompanionEmoji(family, tier) {
  const familyData = COMPANION_FAMILIES.find(f => f.family === family);
  if (!familyData || !familyData.evolutions) return "🎮";
  
  return familyData.evolutions[Math.min(tier, familyData.evolutions.length - 1)];
}

export function getHealthStatus(health) {
  if (health >= 80) return { status: "excellent", color: "text-green-600", emoji: "😊" };
  if (health >= 60) return { status: "good", color: "text-blue-600", emoji: "🙂" };
  if (health >= 40) return { status: "okay", color: "text-yellow-600", emoji: "😐" };
  if (health >= 20) return { status: "poor", color: "text-orange-600", emoji: "😟" };
  return { status: "critical", color: "text-red-600", emoji: "😢" };
}

/**
 * Fetch companion state from server
 */
export async function getCompanionState() {
  try {
    const res = await fetch('/functions/companion/state');
    if (!res.ok) {
      console.warn('Companion endpoint not available');
      return null;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('getCompanionState failed', error);
    return null;
  }
}

/**
 * Select a companion family
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
      return { success: false, error: err.error || 'Failed to select companion' };
    }
    
    const data = await res.json();
    return { success: true, ...data };
  } catch (error) {
    console.error('selectCompanion failed', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Use a streak freeze
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
      return { success: false, error: err.error || 'Failed to use freeze' };
    }
    
    const data = await res.json();
    return { success: true, ...data };
  } catch (error) {
    console.error('useStreakFreeze failed', error);
    return { success: false, error: 'Network error' };
  }
}