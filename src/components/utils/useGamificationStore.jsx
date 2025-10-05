import { useState, useEffect } from "react";
import { gamificationStore, calculateLevel, calculateRank } from "./gamificationStore";

/**
 * React hook to use gamification store
 * Automatically subscribes to updates and re-renders on changes
 * @returns {Object} Current gamification state
 */
export function useGamificationStore() {
  const [state, setState] = useState(gamificationStore.get());

  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = gamificationStore.subscribe((newState) => {
      setState(newState);
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  return state;
}

/**
 * Hook to get specific gamification value with computed properties
 * @returns {Object} Gamification data with computed values
 */
export function useGamification() {
  const state = useGamificationStore();

  return {
    ...state,
    level: calculateLevel(state.points),
    rank: calculateRank(state.points),
    isOnTrack: state.journeyStatus === 'ON_TRACK',
    isAhead: state.journeyStatus === 'AHEAD',
    isBehind: state.journeyStatus === 'BEHIND'
  };
}