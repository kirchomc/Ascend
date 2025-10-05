

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { ToastProvider } from "@/components/ui/toast";
import {
  LayoutDashboard,
  CheckCircle,
  Target,
  BookOpen,
  Library,
  Trophy,
  Sparkles,
  Users,
  Menu,
  Sun,
  Moon,
  LogOut,
  Shield, // Import the Shield icon
  Crown, // Import the Crown icon for premium portal
  BarChart3, // New import for Pro Analytics
  Lightbulb, // New import for Insights
  Rocket, // New import for Beta Features
  Palette, // New import for Themes
  LogIn // New import for Login button in guest mode
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoutePersistence } from "./components/utils/routePersistence";

const navigationItems = [
  { title: "Dashboard", url: "Dashboard", icon: LayoutDashboard },
  { title: "Check-In", url: "CheckIn", icon: CheckCircle },
  { title: "Goals", url: "Goals", icon: Target },
  { title: "Journal", url: "Journal", icon: BookOpen },
  { title: "Library", url: "Library", icon: Library },
  { title: "Community", url: "Community", icon: Users },
  { title: "Challenges", url: "Challenges", icon: Sparkles },
  { title: "Profile", url: "Profile", icon: Trophy },
];

// Add Pro-only navigation items
const proNavigationItems = [
  { title: "Pro Analytics", url: "ProAnalytics", icon: BarChart3 },
  { title: "Insights", url: "ProInsights", icon: Lightbulb },
  { title: "Priority Support", url: "ProSupport", icon: Shield },
  { title: "Beta Features", url: "BetaFeatures", icon: Rocket },
  { title: "Themes", url: "ThemeCustomizer", icon: Palette }
];

const rankSymbols = {
  Beginner: "🌱",
  Explorer: "🗺️",
  Achiever: "⭐",
  Champion: "🏆",
  Master: "👑",
  Legend: "💎",
  Immortal: "🌟"
};

const getRank = (points) => {
  if (points >= 10000) return "Immortal";
  if (points >= 5000) return "Legend";
  if (points >= 2500) return "Master";
  if (points >= 1000) return "Champion";
  if (points >= 500) return "Achiever";
  if (points >= 100) return "Explorer";
  return "Beginner";
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [theme, setTheme] = useState("light");
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Set Welcome as default if user lands on root
    if (window.location.pathname === '/') {
      navigate(createPageUrl('Welcome'));
    }
  }, [navigate]);

  useEffect(() => {
    const guestMode = sessionStorage.getItem('guestMode') === 'true';
    setIsGuest(guestMode);
    if (!guestMode) {
      loadUser();
    } else {
      // Apply theme for guest and ensure user state is cleared
      const guestTheme = localStorage.getItem('theme') || 'light';
      setTheme(guestTheme);
      setUser(null); // Clear user state when in guest mode
      setUserProfile(null); // Clear user profile state when in guest mode
    }
  }, [location, currentPageName]); // Added currentPageName dependency

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem('theme', theme);
  }, [theme]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        const profile = profiles[0];
        setUserProfile(profile);
        setTheme(profile.theme_preference || "light");
      }
    } catch (error) {
      console.error("User not authenticated:", error);
      // If not on welcome page, redirect
      if (currentPageName !== 'Welcome') {
        navigate(createPageUrl('Welcome'));
      }
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (userProfile) { // Only update user profile if user is logged in
      await UserProfile.update(userProfile.id, { theme_preference: newTheme });
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('guestMode'); // Clear guest mode on logout
    await User.logout();
    navigate(createPageUrl('Welcome'));
  };

  const handleLoginRedirect = () => {
    sessionStorage.removeItem('guestMode'); // Clear guest mode if user decides to log in
    navigate(createPageUrl('Welcome'));
  };

  const handleLogoClick = () => {
    navigate(createPageUrl("Dashboard"));
    if (window.gtag) {
      window.gtag('event', 'logo_clicked_home');
    }
  };

  const handleProfileClick = () => {
    navigate(createPageUrl("Profile"));
    if (window.gtag) {
      window.gtag('event', 'profile_chip_clicked');
    }
  };

  if (!user && !isGuest) {
    // Wrap children with ToastProvider even when user is not logged in or in guest mode
    // This allows children (e.g., Welcome page) to use toasts
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  const currentRank = getRank(userProfile?.total_points || 0);
  const rankSymbol = rankSymbols[currentRank];
  const displayName = user?.display_name || user?.full_name || 'Guest'; // Fallback for guest
  const isPro = user?.plan === 'full';

  return (
    <ToastProvider>
      <SidebarProvider>
        <RoutePersistence />
        
        <style>{`
          :root {
            --color-primary: 59, 130, 246;
            --color-secondary: 34, 197, 94;
            --color-accent: 251, 191, 36;
            --gradient-calm: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --gradient-growth: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
          }
          
          .dark {
            --color-primary: 96, 165, 250;
            --color-secondary: 74, 222, 128;
            --color-accent: 253, 224, 71;
            
            /* Improved dark mode readability */
            --tw-bg-opacity: 1;
            background-color: rgb(17 24 39 / var(--tw-bg-opacity));
          }
          
          /* Dark mode text improvements */
          .dark {
            color-scheme: dark;
          }
          
          .dark body {
            background-color: #111827;
            color: #f3f4f6;
          }
          
          .dark .text-gray-900 {
            color: #f9fafb !important;
          }
          
          .dark .text-gray-600 {
            color: #d1d5db !important;
          }
          
          .dark .text-gray-500 {
            color: #9ca3af !important;
          }
          
          .dark .bg-white {
            background-color: #1f2937 !important;
          }
          
          .dark .border-gray-200 {
            border-color: #374151 !important;
          }
          
          .dark .hover\\:bg-gray-100:hover { /* Escaping the colon for tailwind hover class */
            background-color: #374151 !important;
          }
          
          /* Improve card contrast in dark mode */
          .dark .shadow-lg,
          .dark .shadow-xl {
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -2px rgb(0 0 0 / 0.2) !important;
          }
        `}</style>
        
        <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Sidebar className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <SidebarHeader className="border-b border-gray-200 dark:border-gray-700 p-6">
              <button 
                onClick={handleLogoClick}
                className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity cursor-pointer app-header"
                aria-label="Go to dashboard"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg logo">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    GrowthPath
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your journey to better</p>
                </div>
              </button>
            </SidebarHeader>
            
            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => {
                      // Disable certain pages for guests
                      const isDisabled = isGuest && ['Community', 'Challenges', 'Profile'].includes(item.title);
                      const isActive = location.pathname === createPageUrl(item.url);
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            disabled={isDisabled}
                            className={`rounded-xl mb-2 transition-all duration-300 ${
                              isActive 
                                ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md' 
                                : isDisabled
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <Link to={isDisabled ? '#' : createPageUrl(item.url)} className="flex items-center gap-3 px-4 py-3">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                    
                    {/* Premium Portal Link */}
                    {!isGuest && ( // Hide for guests
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          asChild 
                          className={`rounded-xl mb-2 transition-all duration-300 ${
                            location.pathname === createPageUrl('PremiumPortal')
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                              : 'hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 dark:text-gray-300'
                          }`}
                        >
                          <Link to={createPageUrl("PremiumPortal")} className="flex items-center gap-3 px-4 py-3">
                            <Crown className="w-5 h-5" />
                            <span className="font-medium">
                              {isPro ? 'Pro Portal' : 'Upgrade to Pro'}
                            </span>
                            {!isPro && <Sparkles className="w-4 h-4 ml-auto animate-pulse" />}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                    
                    {/* Pro-only features */}
                    {isPro && !isGuest && ( // Hide for guests
                      <>
                        <div className="my-4 px-4">
                          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            <Crown className="w-4 h-4" />
                            Pro Features
                          </div>
                        </div>
                        
                        {proNavigationItems.map((item) => {
                          const isActive = location.pathname === createPageUrl(item.url);
                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton 
                                asChild 
                                className={`rounded-xl mb-2 transition-all duration-300 ${
                                  isActive 
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                                    : 'hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 dark:text-gray-300'
                                }`}
                              >
                                <Link to={createPageUrl(item.url)} className="flex items-center gap-3 px-4 py-3">
                                  <item.icon className="w-5 h-5" />
                                  <span className="font-medium">{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </>
                    )}

                    {/* Admin Link - Only show for admin users */}
                    {user?.role === 'admin' && !isGuest && ( // Hide for guests
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          asChild 
                          className={`rounded-xl mb-2 transition-all duration-300 ${
                            location.pathname === createPageUrl('Admin')
                              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <Link to={createPageUrl("Admin")} className="flex items-center gap-3 px-4 py-3">
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">Admin</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {userProfile && ( // Only show progress if a user profile exists (i.e., not a guest)
                <SidebarGroup className="mt-6">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Your Progress</p>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300">Streak</span>
                      <span className="font-bold text-orange-500">🔥 {userProfile.current_streak} days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Points</span>
                      <span className="font-bold text-yellow-500 flex items-center gap-1">
                        {rankSymbol} {userProfile.total_points}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-center font-medium text-gray-700 dark:text-gray-300">
                        {currentRank}
                      </p>
                    </div>
                  </div>
                </SidebarGroup>
              )}
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-200 dark:border-gray-700 p-4">
              {isGuest ? (
                <Button className="w-full rounded-lg" onClick={handleLoginRedirect}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login to Save Progress
                </Button>
              ) : (
                <>
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center justify-between mb-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    aria-label="Open profile"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500">
                        <AvatarFallback className="text-white font-semibold">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{displayName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Keep growing!</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTheme();
                      }}
                      className="rounded-lg"
                    >
                      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </Button>
                  </button>
                  <Button
                    variant="outline"
                    className="w-full rounded-lg"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-auto">
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 md:hidden sticky top-0 z-10 app-header">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <button 
                  onClick={handleLogoClick}
                  className="logo cursor-pointer hover:opacity-80 transition-opacity"
                  aria-label="Go to dashboard"
                >
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    GrowthPath
                  </h1>
                </button>
              </div>
            </header>

            <div className="flex-1">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ToastProvider>
  );
}

