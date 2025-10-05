import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, Award, Zap, Calendar } from "lucide-react";
import { format, subDays, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

export default function ActivityDetailModal({ open, onClose, checkIns, goals, habits }) {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, -1 = last week, etc.

  // Weekly comparison metrics
  const weeklyMetrics = useMemo(() => {
    const currentWeekStart = startOfWeek(subDays(new Date(), selectedWeek * 7));
    const currentWeekEnd = endOfWeek(currentWeekStart);
    const previousWeekStart = startOfWeek(subDays(currentWeekStart, 7));
    const previousWeekEnd = endOfWeek(previousWeekStart);

    const currentWeekCheckIns = checkIns.filter(c => {
      const date = new Date(c.date || c.created_date);
      return date >= currentWeekStart && date <= currentWeekEnd;
    });

    const previousWeekCheckIns = checkIns.filter(c => {
      const date = new Date(c.date || c.created_date);
      return date >= previousWeekStart && date <= previousWeekEnd;
    });

    // Calculate average mood for weeks
    const calculateAvgMood = (weekCheckIns) => {
      if (weekCheckIns.length === 0) return 0;
      const moodValues = { very_sad: 1, sad: 2, neutral: 3, happy: 4, very_happy: 5 };
      const sum = weekCheckIns.reduce((acc, c) => acc + (moodValues[c.mood] || 3), 0);
      return (sum / weekCheckIns.length).toFixed(1);
    };

    const currentAvgMood = calculateAvgMood(currentWeekCheckIns);
    const previousAvgMood = calculateAvgMood(previousWeekCheckIns);
    const moodChange = currentAvgMood - previousAvgMood;

    // Habits completion this week
    const currentWeekHabits = currentWeekCheckIns.reduce((sum, c) => sum + (c.habits_completed?.length || 0), 0);
    const previousWeekHabits = previousWeekCheckIns.reduce((sum, c) => sum + (c.habits_completed?.length || 0), 0);
    const habitsChange = currentWeekHabits - previousWeekHabits;

    // Points earned this week
    const currentWeekPoints = currentWeekCheckIns.reduce((sum, c) => sum + (c.points_earned || 10), 0);
    const previousWeekPoints = previousWeekCheckIns.reduce((sum, c) => sum + (c.points_earned || 10), 0);
    const pointsChange = currentWeekPoints - previousWeekPoints;

    return {
      currentWeekCheckIns: currentWeekCheckIns.length,
      previousWeekCheckIns: previousWeekCheckIns.length,
      checkInsChange: currentWeekCheckIns.length - previousWeekCheckIns.length,
      currentAvgMood: parseFloat(currentAvgMood),
      previousAvgMood: parseFloat(previousAvgMood),
      moodChange,
      currentWeekHabits,
      previousWeekHabits,
      habitsChange,
      currentWeekPoints,
      previousWeekPoints,
      pointsChange,
      weekStart: format(currentWeekStart, 'MMM d'),
      weekEnd: format(currentWeekEnd, 'MMM d')
    };
  }, [checkIns, selectedWeek]);

  // Best and worst days analysis
  const dayAnalysis = useMemo(() => {
    const moodValues = { very_sad: 1, sad: 2, neutral: 3, happy: 4, very_happy: 5 };
    const daysWithMood = checkIns.map(c => ({
      date: c.date || format(new Date(c.created_date), 'yyyy-MM-dd'),
      mood: c.mood,
      moodValue: moodValues[c.mood] || 3,
      habitsCount: c.habits_completed?.length || 0
    }));

    daysWithMood.sort((a, b) => b.moodValue - a.moodValue);
    const bestDays = daysWithMood.slice(0, 3);
    const worstDays = daysWithMood.slice(-3).reverse();

    return { bestDays, worstDays };
  }, [checkIns]);

  const getMoodEmoji = (mood) => {
    const emojis = {
      very_sad: "😞",
      sad: "😐",
      neutral: "🙂",
      happy: "😃",
      very_happy: "🤩"
    };
    return emojis[mood] || "🙂";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            Weekly Insights & Comparisons
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Week Selector */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedWeek(selectedWeek - 1)}
              className="rounded-lg"
            >
              ← Previous Week
            </Button>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-white">
                {selectedWeek === 0 ? "This Week" : `${Math.abs(selectedWeek)} Week${Math.abs(selectedWeek) > 1 ? 's' : ''} Ago`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {weeklyMetrics.weekStart} - {weeklyMetrics.weekEnd}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedWeek(selectedWeek + 1)}
              disabled={selectedWeek === 0}
              className="rounded-lg"
            >
              Next Week →
            </Button>
          </div>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Check-Ins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{weeklyMetrics.currentWeekCheckIns}</span>
                  <div className="flex items-center gap-1 text-sm">
                    {weeklyMetrics.checkInsChange > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">+{weeklyMetrics.checkInsChange}</span>
                      </>
                    ) : weeklyMetrics.checkInsChange < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="text-red-600 font-medium">{weeklyMetrics.checkInsChange}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs last week: {weeklyMetrics.previousWeekCheckIns}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Mood</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{weeklyMetrics.currentAvgMood}/5</span>
                  <div className="flex items-center gap-1 text-sm">
                    {weeklyMetrics.moodChange > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">+{weeklyMetrics.moodChange.toFixed(1)}</span>
                      </>
                    ) : weeklyMetrics.moodChange < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="text-red-600 font-medium">{weeklyMetrics.moodChange.toFixed(1)}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs last week: {weeklyMetrics.previousAvgMood}/5</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Habits Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{weeklyMetrics.currentWeekHabits}</span>
                  <div className="flex items-center gap-1 text-sm">
                    {weeklyMetrics.habitsChange > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">+{weeklyMetrics.habitsChange}</span>
                      </>
                    ) : weeklyMetrics.habitsChange < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="text-red-600 font-medium">{weeklyMetrics.habitsChange}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs last week: {weeklyMetrics.previousWeekHabits}</p>
              </CardContent>
            </Card>
          </div>

          {/* Best & Worst Days */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Your Best Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayAnalysis.bestDays.map((day, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {format(new Date(day.date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {day.habitsCount} habits completed
                        </p>
                      </div>
                      <div className="text-2xl">{getMoodEmoji(day.mood)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Days To Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayAnalysis.worstDays.map((day, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {format(new Date(day.date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {day.habitsCount} habits completed
                        </p>
                      </div>
                      <div className="text-2xl">{getMoodEmoji(day.mood)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Week Overview</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {weeklyMetrics.checkInsChange > 0 && "Great improvement in consistency this week! "}
              {weeklyMetrics.moodChange > 0 && "Your mood is trending upward! "}
              {weeklyMetrics.habitsChange > 0 && "You're building stronger habits! "}
              {weeklyMetrics.checkInsChange <= 0 && weeklyMetrics.moodChange <= 0 && weeklyMetrics.habitsChange <= 0 && 
                "Every week is a new opportunity. Keep pushing forward!"}
            </p>
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