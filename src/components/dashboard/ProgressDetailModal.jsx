
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Target, CheckCircle, Flame, Calendar, Award, Sparkles, Lightbulb, Info } from "lucide-react";
import { Goal } from '@/api/entities';
import { Habit } from '@/api/entities';
import { DailyCheckIn } from '@/api/entities';
import { User } from '@/api/entities';

const AREA_ICONS = {
  happiness: "😊",
  fitness: "💪",
  focus: "🎯",
  relationships: "❤️",
  health: "🏥",
  mindset: "🧠",
  productivity: "⚡",
  sleep: "😴",
  learning: "📚",
  creativity: "🎨"
};

const AREA_COLORS = {
  happiness: "from-yellow-400 to-orange-500",
  fitness: "from-green-400 to-emerald-500",
  focus: "from-blue-400 to-indigo-500",
  relationships: "from-pink-400 to-rose-500",
  health: "from-red-400 to-pink-500",
  mindset: "from-purple-400 to-indigo-500",
  productivity: "from-cyan-400 to-blue-500",
  sleep: "from-indigo-400 to-purple-500",
  learning: "from-orange-400 to-amber-500",
  creativity: "from-pink-400 to-purple-500"
};

/**
 * Client-side calculation for focus area progress
 */
async function calculateFocusAreaProgressClientSide() {
  try {
    const user = await User.me();
    if (!user || !user.email) return []; // Return empty if guest or no user

    const today = new Date().toISOString().slice(0, 10);
    
    const areas = ['happiness', 'fitness', 'focus', 'relationships', 'health', 'mindset', 'productivity', 'sleep', 'learning', 'creativity'];
    
    const [allGoals, allActiveHabits, todayCheckIn] = await Promise.all([
      Goal.filter({ created_by: user.email }),
      Habit.filter({ created_by: user.email, is_active: true }),
      DailyCheckIn.filter({ created_by: user.email, date: today })
    ]);
    
    const habitsCompletedToday = todayCheckIn.length > 0 ? (todayCheckIn[0].habits_completed || []) : [];
    
    const areaStats = areas.map(area => {
      const areaGoals = allGoals.filter(g => (g.category || g.focus_area)?.toLowerCase() === area);
      const goalsTotal = areaGoals.length;
      const goalsCompleted = areaGoals.filter(g => g.completed).length;
      
      const areaHabits = allActiveHabits.filter(h => (h.category || h.focus_area)?.toLowerCase() === area);
      const habitsActive = areaHabits.length;
      
      const areaHabitIds = areaHabits.map(h => h.id);
      const habitsCompletedTodayCount = habitsCompletedToday.filter(id => areaHabitIds.includes(id)).length;
      
      const percentGoalsCompleted = goalsTotal > 0 ? Math.round((goalsCompleted / goalsTotal) * 100) : 0;
      
      return {
        area,
        goals_total: goalsTotal,
        goals_completed: goalsCompleted,
        habits_active: habitsActive,
        habits_completed_today: habitsCompletedTodayCount,
        percent_goals_completed: percentGoalsCompleted
      };
    }).filter(stat => stat.goals_total > 0 || stat.habits_active > 0);
    
    return areaStats;
  } catch (error) {
    console.error('Client-side focus area calculation failed', error);
    return [];
  }
}


export default function ProgressDetailModal({ open, onClose, userProfile, goals, habits, checkIns }) {
  const [focusAreaData, setFocusAreaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      loadFocusAreaProgress();
    }
  }, [open]);

  const loadFocusAreaProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      // Directly use the client-side calculation
      const data = await calculateFocusAreaProgressClientSide();
      setFocusAreaData(data || []);
    } catch (error) {
      console.error("Error loading focus area progress:", error);
      setError("Could not load focus area data");
      setFocusAreaData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall metrics from server data or fallback to local
  const activeGoals = goals?.filter(g => !g.completed) || [];
  const completedGoals = goals?.filter(g => g.completed) || [];
  const goalCompletionRate = goals?.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;
  
  const activeHabitsCount = habits?.filter(h => h.is_active).length || 0;
  const habitTargetCount = 10;
  const habitProgress = Math.min((activeHabitsCount / habitTargetCount) * 100, 100);

  const currentStreak = userProfile?.current_streak || 0;
  const streakTarget = 30;
  const streakProgress = Math.min((currentStreak / streakTarget) * 100, 100);

  const checkInsThisMonth = checkIns?.filter(c => {
    const checkInDate = new Date(c.date || c.created_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return checkInDate >= thirtyDaysAgo;
  }).length || 0;
  const consistencyRate = Math.round((checkInsThisMonth / 30) * 100);

  const overallScore = Math.round(
    (goalCompletionRate * 0.3) + 
    (habitProgress * 0.2) + 
    (streakProgress * 0.3) + 
    (consistencyRate * 0.2)
  );

  const getScoreMessage = (score) => {
    if (score >= 90) return { text: "Outstanding! You're Crushing It! 🌟", color: "text-green-600 dark:text-green-400" };
    if (score >= 75) return { text: "Excellent Work! Keep It Up! 💪", color: "text-blue-600 dark:text-blue-400" };
    if (score >= 60) return { text: "Great Progress! You're On Track! 🎯", color: "text-purple-600 dark:text-purple-400" };
    if (score >= 40) return { text: "Good Start! Keep Building Momentum! 🚀", color: "text-yellow-600 dark:text-yellow-400" };
    return { text: "Every Journey Starts Somewhere! Let's Go! 💫", color: "text-orange-600 dark:text-orange-400" };
  };

  const scoreMessage = getScoreMessage(overallScore);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            Your Progress Overview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Overall Score */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl text-center">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Overall Progress Score</h3>
            <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {overallScore}%
            </div>
            <p className={`text-lg font-medium ${scoreMessage.color}`}>
              {scoreMessage.text}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-blue-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Goals</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                  <span className="font-semibold">{Math.round(goalCompletionRate)}%</span>
                </div>
                <Progress value={goalCompletionRate} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {completedGoals.length} of {goals?.length || 0} completed
                </p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-purple-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Habits</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Active Habits</span>
                  <span className="font-semibold">{Math.round(habitProgress)}%</span>
                </div>
                <Progress value={habitProgress} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activeHabitsCount} of {habitTargetCount} target
                </p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Streak</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Current Progress</span>
                  <span className="font-semibold">{Math.round(streakProgress)}%</span>
                </div>
                <Progress value={streakProgress} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentStreak} of {streakTarget} day target
                </p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-green-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Consistency</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Last 30 Days</span>
                  <span className="font-semibold">{consistencyRate}%</span>
                </div>
                <Progress value={consistencyRate} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {checkInsThisMonth} of 30 days
                </p>
              </div>
            </div>
          </div>

          {/* Focus Areas from Server */}
          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading focus area data...</p>
            </div>
          )}

          {error && (
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                {error} - showing basic stats instead
              </AlertDescription>
            </Alert>
          )}

          {!loading && focusAreaData.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Progress By Focus Area
              </h3>
              <div className="space-y-3">
                {focusAreaData.map((area) => {
                  const icon = AREA_ICONS[area.area] || "📊";
                  const color = AREA_COLORS[area.area] || "from-gray-400 to-gray-500";
                  
                  return (
                    <div key={area.area} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{icon}</span>
                          <div>
                            <h4 className="font-medium capitalize text-gray-900 dark:text-white">{area.area}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {area.goals_completed}/{area.goals_total} goals • {area.habits_active} active habits
                            </p>
                          </div>
                        </div>
                        <Badge 
                          className={`bg-gradient-to-r ${color} text-white border-0`}
                        >
                          {area.percent_goals_completed}%
                        </Badge>
                      </div>
                      <Progress value={area.percent_goals_completed} className="h-2" />
                      {area.habits_completed_today > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          ✓ {area.habits_completed_today} habit{area.habits_completed_today !== 1 ? 's' : ''} completed today
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && focusAreaData.length === 0 && !error && (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Info className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No focus area data yet. Create goals and habits with categories to see progress here!
              </p>
            </div>
          )}

          {/* Quick Tips */}
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Quick Tips To Improve
            </h3>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {goalCompletionRate < 60 && <li>✓ Focus on completing smaller, achievable goals</li>}
              {activeHabitsCount < 5 && <li>✓ Add more daily habits to build consistency</li>}
              {currentStreak < 7 && <li>✓ Check in daily to build a strong streak</li>}
              {consistencyRate < 70 && <li>✓ Try to check in at the same time each day</li>}
              <li>✓ Celebrate small wins along the way!</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose} className="rounded-xl">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
