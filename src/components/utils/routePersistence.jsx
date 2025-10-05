import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Component to handle route persistence and default landing page
 */
export function RoutePersistence() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Save current route before page unload
    const handleBeforeUnload = () => {
      const currentRoute = location.pathname + location.search;
      sessionStorage.setItem('lastRoute', currentRoute);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location]);

  useEffect(() => {
    // On app load, navigate to Dashboard if on root
    const isRoot = location.pathname === '/' || location.pathname === '';
    
    if (isRoot) {
      // Navigate to Dashboard as default
      navigate(createPageUrl('Dashboard'), { replace: true });
    }
  }, []); // Only run once on mount

  return null;
}

/**
 * Hook to manually save current route
 */
export function useSaveRoute() {
  const location = useLocation();

  useEffect(() => {
    const currentRoute = location.pathname + location.search;
    sessionStorage.setItem('lastRoute', currentRoute);
  }, [location]);
}

/**
 * Get last saved route
 */
export function getLastRoute() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('lastRoute');
}

/**
 * Clear saved route
 */
export function clearLastRoute() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('lastRoute');
}