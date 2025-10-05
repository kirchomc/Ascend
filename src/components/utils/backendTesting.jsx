/**
 * Backend Testing Utilities
 * Use these functions to test your deployed backend endpoints
 */

/**
 * Test all backend endpoints
 * Run this in browser console after deploying backend:
 * 
 * import { testBackend } from '@/components/utils/backendTesting'
 * await testBackend()
 */
export async function testBackend() {
  console.log('🧪 Testing Backend Endpoints...\n');
  
  const tests = [
    { name: 'Ping', url: '/functions/ping', method: 'GET' },
    { name: 'Config', url: '/functions/config', method: 'GET' },
    { name: 'User Stats', url: '/functions/user/stats', method: 'GET' },
    { name: 'Focus Areas', url: '/functions/progress/focus-areas', method: 'GET' },
    { name: 'Companion State', url: '/functions/companion/state', method: 'GET' },
    { name: 'Badges List', url: '/functions/badges/list', method: 'GET' },
    { name: 'Weekly Quests', url: '/functions/quests/weekly', method: 'GET' },
    { name: 'Social Config', url: '/functions/social/config', method: 'GET' },
    { name: 'Current Challenge', url: '/functions/challenges/current', method: 'GET' },
    { name: 'My Progress', url: '/functions/challenges/my-progress', method: 'GET' },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const res = await fetch(test.url, { method: test.method });
      const data = await res.json();
      
      if (res.ok) {
        console.log(`✅ ${test.name}:`, data);
        results.push({ test: test.name, status: 'PASS', data });
      } else {
        console.log(`❌ ${test.name}: HTTP ${res.status}`, data);
        results.push({ test: test.name, status: 'FAIL', error: `HTTP ${res.status}` });
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      results.push({ test: test.name, status: 'ERROR', error: error.message });
    }
  }

  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status !== 'PASS').length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  return results;
}

/**
 * Quick endpoint availability check
 */
export async function checkEndpoints() {
  const endpoints = [
    '/functions/ping',
    '/functions/config',
    '/functions/user/stats',
  ];

  console.log('🔍 Checking endpoint availability...\n');

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        console.log(`✅ ${endpoint} - Available`);
      } else {
        console.log(`❌ ${endpoint} - HTTP ${res.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - ${error.message}`);
    }
  }
}

/**
 * Test check-in endpoint
 */
export async function testCheckIn(mood = 'happy', habits = []) {
  try {
    const res = await fetch('/functions/recordCheckIn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood,
        mood_emoji: '😊',
        habits_completed: habits,
        notes: 'Test check-in from testing utilities'
      })
    });

    const data = await res.json();
    console.log('Check-in result:', data);
    return data;
  } catch (error) {
    console.error('Check-in failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test goal completion
 */
export async function testGoalCompletion(goalId, completed = true) {
  try {
    const res = await fetch('/functions/goals/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_id: goalId, completed })
    });

    const data = await res.json();
    console.log('Goal completion result:', data);
    return data;
  } catch (error) {
    console.error('Goal completion failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Make testing available globally in browser console
 */
if (typeof window !== 'undefined') {
  window.__backendTests = {
    testAll: testBackend,
    checkEndpoints,
    testCheckIn,
    testGoalCompletion
  };
  
  console.log('🧪 Backend testing utilities loaded!');
  console.log('Run: await window.__backendTests.testAll()');
}