
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { DailyCheckIn } from "@/api/entities";
import { Goal } from "@/api/entities";
import { Habit } from "@/api/entities";
import { Milestone } from "@/api/entities";
import { format, startOfToday } from "date-fns";
import { motion } from "framer-motion";
import {
  Flame,
  Star,
  TrendingUp,
  CheckCircle,
  Target,
  BookOpen,
  Sparkles,
  ArrowRight,
  Calendar,
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import StatCard from "../components/dashboard/StatCard";
import QuoteCard from "../components/dashboard/QuoteCard";
import RecentGoals from "../components/dashboard/RecentGoals";
import ActivityHeatmap from "../components/dashboard/ActivityHeatmap";
import ClickableCard from "../components/dashboard/ClickableCard";
import CheckInDetailModal from "../components/dashboard/CheckInDetailModal";
import GoalsDetailModal from "../components/dashboard/GoalsDetailModal";
import AchievementsDetailModal from "../components/dashboard/AchievementsDetailModal";
import ActivityDetailModal from "../components/dashboard/ActivityDetailModal";
import StreakDetailModal from "../components/dashboard/StreakDetailModal";
import PointsDetailModal from "../components/dashboard/PointsDetailModal";
import ProgressDetailModal from "../components/dashboard/ProgressDetailModal";

import { useGamificationUpdates } from "@/components/utils/gamification";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [state, setState] = useState({
    user: null,
    userProfile: null,
    todayCheckIn: null,
    recentGoals: [],
    allGoals: [],
    activeHabits: [],
    recentMilestones: [],
    checkInsData: [],
    loading: true
  });
  const [isGuest, setIsGuest] = useState(sessionStorage.getItem('guestMode') === 'true');
  
  // Modal states
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Cache for no-flicker experience
  const cacheRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set Dashboard as default if user lands on root
  React.useEffect(() => {
    if (window.location.pathname === '/') {
      navigate(createPageUrl('Dashboard'));
    }
  }, [navigate]);

  const loadDashboardData = useCallback(async () => {
    const guestMode = sessionStorage.getItem('guestMode') === 'true';
    setIsGuest(guestMode);

    if (guestMode) {
      setState({
        user: null, userProfile: null, todayCheckIn: null, recentGoals: [], allGoals: [],
        activeHabits: [], recentMilestones: [], checkInsData: [], loading: false
      });
      return;
    }

    try {
      // Show cached data immediately on first render
      if (isFirstRender.current && cacheRef.current) {
        setState(prev => ({ ...prev, ...cacheRef.current, loading: false }));
      }

      const currentUser = await User.me();

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length === 0) {
        navigate(createPageUrl("Onboarding"));
        return;
      }
      const userProfile = profiles[0];

      const today = format(startOfToday(), 'yyyy-MM-dd');
      const checkIns = await DailyCheckIn.filter({ created_by: currentUser.email, date: today });
      const todayCheckIn = checkIns.length > 0 ? checkIns[0] : null;

      const goals = await Goal.filter({ created_by: currentUser.email, status: 'active' }, '-created_date', 5);
      const allUserGoals = await Goal.filter({ created_by: currentUser.email }, '-created_date');
      const habits = await Habit.filter({ created_by: currentUser.email, is_active: true });
      const milestones = await Milestone.filter({ created_by: currentUser.email }, '-achieved_date', 3);
      const allCheckIns = await DailyCheckIn.filter({ created_by: currentUser.email }, '-date');

      // Atomic state swap - update everything at once to avoid flicker
      const newState = {
        user: currentUser,
        userProfile,
        todayCheckIn,
        recentGoals: goals,
        allGoals: allUserGoals,
        activeHabits: habits,
        recentMilestones: milestones,
        checkInsData: allCheckIns,
        loading: false
      };

      setState(newState);
      cacheRef.current = newState;
      isFirstRender.current = false;

      // Analytics
      if (window.gtag) {
        window.gtag('event', 'dashboard_layout_rendered', {
          profile_id: isMobile ? 'mobile' : isDesktop ? 'desktop' : 'tablet',
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight
        });
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      if (error.message.includes('401')) {
        navigate(createPageUrl('Welcome'));
      }
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [navigate, isMobile, isDesktop]);

  useEffect(() => {
    // Debounce initial load by 50ms for smoother render
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 50);

    return () => clearTimeout(timer);
  }, [loadDashboardData]);

  // Listen for real-time gamification updates, but only if not a guest
  useGamificationUpdates(isGuest ? null : (payload) => {
    console.log('📢 Gamification update received:', payload);
    loadDashboardData();
  });

  const { user, userProfile, todayCheckIn, recentGoals, allGoals, activeHabits, recentMilestones, checkInsData, loading } = state;

  const completedGoalsCount = recentGoals.filter(g => g.status === 'completed').length;
  const goalCompletionRate = recentGoals.length > 0 ? (completedGoalsCount / recentGoals.length) * 100 : 0;

  // Show cached/placeholder content while loading
  if (loading && !cacheRef.current && !isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guest View
  if (isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Welcome, Guest!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              You are viewing a preview of the GrowthPath dashboard.
            </p>
          </motion.div>
          <Card className="max-w-lg mx-auto bg-gradient-to-br from-blue-500 to-green-500 text-white border-none shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-2">Unlock Your Full Potential</h3>
              <p className="text-white/90 mb-4">
                Log in or sign up to save your progress, set goals, track habits, and join our community.
              </p>
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 rounded-xl"
                onClick={() => {
                  sessionStorage.removeItem('guestMode');
                  navigate(createPageUrl("Welcome"));
                }}
              >
                <LogIn className="mr-2 w-5 h-5" />
                Login / Sign Up
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Welcome back!
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300">
              {todayCheckIn 
                ? "Great work today! 🎉" 
                : "Ready to check in?"}
            </p>
          </motion.div>

          <div className="space-y-4">
            {!todayCheckIn && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="bg-gradient-to-br from-blue-500 to-green-500 text-white border-none shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2">Today's Check-In</h3>
                    <p className="text-white/90 mb-4">How are you feeling today?</p>
                    <Button
                      size="lg"
                      className="w-full bg-white text-blue-600 hover:bg-gray-100 rounded-xl"
                      onClick={() => navigate(createPageUrl("CheckIn"))}
                    >
                      Start Check-In
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Streak"
                value={`${userProfile?.current_streak || 0}d`}
                icon={Flame}
                gradient="from-orange-400 to-red-500"
                subtitle={`Best: ${userProfile?.longest_streak || 0}d`}
                onClick={() => setShowStreakModal(true)}
              />
              <StatCard
                title="Points"
                value={userProfile?.total_points || 0}
                icon={Star}
                gradient="from-yellow-400 to-amber-500"
                subtitle="Keep earning!"
                onClick={() => setShowPointsModal(true)}
              />
            </div>

            <ClickableCard onClick={() => setShowGoalsModal(true)}>
              <RecentGoals goals={recentGoals} onRefresh={loadDashboardData} />
            </ClickableCard>

            <QuoteCard />

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  onClick={() => navigate(createPageUrl("Goals"))}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Create New Goal
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  onClick={() => navigate(createPageUrl("Journal"))}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Write in Journal
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  onClick={() => navigate(createPageUrl("Challenges"))}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Join a Challenge
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Modals */}
          <CheckInDetailModal
            open={showCheckInModal}
            onClose={() => setShowCheckInModal(false)}
            checkIn={todayCheckIn}
            streak={userProfile?.current_streak || 0}
            totalCheckIns={checkInsData.length}
            allCheckIns={checkInsData}
          />

          <GoalsDetailModal
            open={showGoalsModal}
            onClose={() => setShowGoalsModal(false)}
            goals={allGoals}
            onRefresh={loadDashboardData}
          />

          <AchievementsDetailModal
            open={showAchievementsModal}
            onClose={() => setShowAchievementsModal(false)}
            milestones={recentMilestones}
            totalPoints={userProfile?.total_points || 0}
            currentStreak={userProfile?.current_streak || 0}
            checkIns={checkInsData}
            goals={allGoals}
          />

          <ActivityDetailModal
            open={showActivityModal}
            onClose={() => setShowActivityModal(false)}
            checkIns={checkInsData}
            goals={allGoals}
            habits={activeHabits}
          />

          <StreakDetailModal
            open={showStreakModal}
            onClose={() => setShowStreakModal(false)}
            currentStreak={userProfile?.current_streak || 0}
            longestStreak={userProfile?.longest_streak || 0}
            checkIns={checkInsData}
          />

          <PointsDetailModal
            open={showPointsModal}
            onClose={() => setShowPointsModal(false)}
            totalPoints={userProfile?.total_points || 0}
            checkIns={checkInsData}
            goals={allGoals}
            milestones={recentMilestones}
          />

          <ProgressDetailModal
            open={showProgressModal}
            onClose={() => setShowProgressModal(false)}
            userProfile={userProfile}
            goals={allGoals}
            habits={activeHabits}
            checkIns={checkInsData}
          />
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {todayCheckIn 
              ? "Great work today! Keep the momentum going 🎉" 
              : "Ready to make today amazing? Start with your check-in!"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Current Streak"
            value={`${userProfile?.current_streak || 0} days`}
            icon={Flame}
            gradient="from-orange-400 to-red-500"
            subtitle={`Best: ${userProfile?.longest_streak || 0} days`}
            onClick={() => setShowStreakModal(true)}
          />
          <StatCard
            title="Total Points"
            value={userProfile?.total_points || 0}
            icon={Star}
            gradient="from-yellow-400 to-amber-500"
            subtitle="Keep earning!"
            onClick={() => setShowPointsModal(true)}
          />
          <StatCard
            title="Active Goals"
            value={recentGoals.length}
            icon={Target}
            gradient="from-blue-400 to-cyan-500"
            subtitle={`${completedGoalsCount} completed`}
            onClick={() => setShowGoalsModal(true)}
          />
          <StatCard
            title="Check-ins"
            value={checkInsData.length}
            icon={CheckCircle}
            gradient="from-green-400 to-emerald-500"
            subtitle="Total recorded"
            onClick={() => setShowActivityModal(true)}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {!todayCheckIn && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="bg-gradient-to-br from-blue-500 to-green-500 text-white border-none shadow-xl">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Daily Check-In</h3>
                        <p className="text-white/90 mb-4">
                          How are you feeling today? Let's track your progress!
                        </p>
                        <Button
                          size="lg"
                          className="bg-white text-blue-600 hover:bg-gray-100 rounded-xl"
                          onClick={() => navigate(createPageUrl("CheckIn"))}
                        >
                          Start Check-In
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </div>
                      <CheckCircle className="w-24 h-24 text-white/20" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {todayCheckIn && (
              <ClickableCard onClick={() => setShowCheckInModal(true)}>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Today's Check-In Complete!</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          Great job checking in today 🎉
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Click to view details
                        </p>
                      </div>
                      <CheckCircle className="w-16 h-16 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </ClickableCard>
            )}

            <QuoteCard />

            <ClickableCard onClick={() => setShowGoalsModal(true)}>
              <RecentGoals goals={recentGoals} onRefresh={loadDashboardData} />
            </ClickableCard>

            <ClickableCard onClick={() => setShowActivityModal(true)}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Activity Overview
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to see detailed stats</p>
                </CardHeader>
                <CardContent>
                  <ActivityHeatmap checkIns={checkInsData} />
                </CardContent>
              </Card>
            </ClickableCard>
          </div>

          <div className="space-y-6">
            <ClickableCard onClick={() => setShowProgressModal(true)}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Progress Overview
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click for detailed breakdown</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Goal Completion</span>
                      <span className="font-semibold">{Math.round(goalCompletionRate)}%</span>
                    </div>
                    <Progress value={goalCompletionRate} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Active Habits</span>
                      <span className="font-semibold">{activeHabits.length}</span>
                    </div>
                    <Progress value={Math.min((activeHabits.length / (userProfile?.daily_habit_limit || 5)) * 100, 100)} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            </ClickableCard>

            <ClickableCard onClick={() => setShowAchievementsModal(true)}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Recent Achievements
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to see all achievements</p>
                </CardHeader>
                <CardContent>
                  {recentMilestones.length > 0 ? (
                    <div className="space-y-3">
                      {recentMilestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
                          <div className="text-3xl">{milestone.badge_icon || "🏆"}</div>
                          <div>
                            <p className="font-semibold text-sm">{milestone.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(milestone.achieved_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Complete your first milestone to see achievements here!
                    </p>
                  )}
                </CardContent>
              </Card>
            </ClickableCard>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  onClick={() => navigate(createPageUrl("Goals"))}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Create New Goal
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  onClick={() => navigate(createPageUrl("Journal"))}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Write in Journal
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  onClick={() => navigate(createPageUrl("Challenges"))}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Join a Challenge
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        <CheckInDetailModal
          open={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
          checkIn={todayCheckIn}
          streak={userProfile?.current_streak || 0}
          totalCheckIns={checkInsData.length}
          allCheckIns={checkInsData}
        />

        <GoalsDetailModal
          open={showGoalsModal}
          onClose={() => setShowGoalsModal(false)}
          goals={allGoals}
          onRefresh={loadDashboardData}
        />

        <AchievementsDetailModal
          open={showAchievementsModal}
          onClose={() => setShowAchievementsModal(false)}
          milestones={recentMilestones}
          totalPoints={userProfile?.total_points || 0}
          currentStreak={userProfile?.current_streak || 0}
          checkIns={checkInsData}
          goals={allGoals}
        />

        <ActivityDetailModal
          open={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          checkIns={checkInsData}
          goals={allGoals}
          habits={activeHabits}
        />

        <StreakDetailModal
          open={showStreakModal}
          onClose={() => setShowStreakModal(false)}
          currentStreak={userProfile?.current_streak || 0}
          longestStreak={userProfile?.longest_streak || 0}
          checkIns={checkInsData}
        />

        <PointsDetailModal
          open={showPointsModal}
          onClose={() => setShowPointsModal(false)}
          totalPoints={userProfile?.total_points || 0}
          checkIns={checkInsData}
          goals={allGoals}
          milestones={recentMilestones}
        />

        <ProgressDetailModal
          open={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          userProfile={userProfile}
          goals={allGoals}
          habits={activeHabits}
          checkIns={checkInsData}
        />
      </div>
    </div>
  );
}
