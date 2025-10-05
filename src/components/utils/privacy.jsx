import { User } from "@/api/entities";

/**
 * Get safe public profile data for community display
 * NEVER expose private information (journals, personal notes, etc.)
 */
export async function getPublicProfile(user) {
  if (!user) return null;

  return {
    id: user.id,
    displayName: user.display_name || user.full_name || 'User',
    avatarUrl: user.avatar_url || null,
    // Only expose safe gamification stats
    level: calculateLevel(user.total_points || 0),
    points: user.total_points || 0,
    streak: user.current_streak || 0
  };
}

/**
 * Calculate user level from points
 */
function calculateLevel(points) {
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
 * Get safe display name for current user
 */
export async function getMyDisplayName() {
  try {
    const user = await User.me();
    return user.display_name || user.full_name || 'User';
  } catch (error) {
    return 'User';
  }
}

/**
 * Update user's public display name
 */
export async function updateDisplayName(displayName) {
  try {
    const user = await User.me();
    await User.update(user.id, { display_name: displayName });
    return { success: true };
  } catch (error) {
    console.error("Error updating display name:", error);
    return { success: false, error: error.message };
  }
}