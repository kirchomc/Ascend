/**
 * Moderation & Reporting Utilities
 * For community safety features
 */

/**
 * Report a forum post
 */
export async function reportPost(postId, reason) {
  try {
    const res = await fetch('/functions/moderation/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, reason })
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }
    
    const data = await res.json();
    return { success: true, reports: data.reports };
  } catch (error) {
    console.error('reportPost failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Ban a user from forums (admin only)
 */
export async function banUser(userEmail) {
  try {
    const res = await fetch('/functions/moderation/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail })
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('banUser failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Report reasons for dropdown
 */
export const REPORT_REASONS = [
  { value: "spam", label: "Spam or Advertising" },
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "misinformation", label: "False Information" },
  { value: "other", label: "Other" }
];