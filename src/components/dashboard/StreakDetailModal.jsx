
import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Calendar, TrendingUp, Zap, CheckCircle, X } from "lucide-react";
import { format, subDays, startOfDay, isToday } from "date-fns";

export default function StreakDetailModal({ open, onClose, currentStreak, longestStreak, checkIns }) {
  // Calculate streak data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(startOfDay(new Date()), 29 - i), 'yyyy-MM-dd');
    const checkIn = checkIns.find(c => c.date === date);
    const dateObj = new Date(date);
    const todayStart = startOfDay(new Date());
    const dayStart = startOfDay(dateObj);

    return {
      date,
      hasCheckIn: !!checkIn,
      isToday: isToday(dateObj),
      isFuture: dayStart > todayStart, // A day is future if its start is after today's start
      dayName: format(dateObj, 'EEE'),
      day: format(dateObj, 'd')
    };
  });

  const streakMilestones = [
    { days: 7, title: "Week Warrior", icon: "🔥", color: "from-orange-400 to-red-500", tip: "Great start! Keep the momentum going every single day." },
    { days: 14, title: "Fortnight Fighter", icon: "💪", color: "from-red-400 to-pink-500", tip: "Two weeks strong! You're building real habits now." },
    { days: 30, title: "Monthly Master", icon: "🏆", color: "from-yellow-400 to-orange-500", tip: "One month! This is when habits become automatic." },
    { days: 60, title: "Dedication Diamond", icon: "💎", color: "from-blue-400 to-cyan-500", tip: "Two months in! You're proving incredible dedication." },
    { days: 90, title: "Quarter Champion", icon: "👑", color: "from-purple-400 to-pink-500", tip: "90 days! Research shows this is when true transformation happens." },
    { days: 180, title: "Half Year Hero", icon: "⭐", color: "from-yellow-400 to-amber-500", tip: "Half a year! You've made this part of who you are." },
    { days: 365, title: "Year Legend", icon: "🎖️", color: "from-green-400 to-emerald-500", tip: "One full year! You're an inspiration to everyone around you." }
  ];

  const nextMilestone = streakMilestones.find(m => m.days > currentStreak) || streakMilestones[streakMilestones.length - 1];
  const achievedMilestones = streakMilestones.filter(m => longestStreak >= m.days);
  const daysToNext = nextMilestone.days - currentStreak;

  // Daily rotating motivational messages
  const motivationalMessages = [
    "Every day counts! Keep building your streak! 🌟",
    "You're doing amazing! One day at a time. 💪",
    "Consistency is the key to success! 🔑",
    "Your dedication is inspiring! Keep going! 🚀",
    "Small steps lead to big changes! 👣",
    "Progress, not perfection! You've got this! ✨",
    "Each check-in makes you stronger! 💫",
    "You're writing your success story daily! 📖",
    "Stay committed to your journey! 🎯",
    "Your future self will thank you! 🙌"
  ];
  
  // Use day of year to rotate message daily
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const dailyMessage = motivationalMessages[dayOfYear % motivationalMessages.length];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            Your Streak Journey
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
              <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{currentStreak}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{longestStreak}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
              <Zap className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{daysToNext}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Days To Next</p>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl cursor-pointer hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Next Milestone: {nextMilestone.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{nextMilestone.tip}</p>
              </div>
              <div className="text-4xl">{nextMilestone.icon}</div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">{currentStreak} / {nextMilestone.days} Days</span>
                <span className="font-semibold">{Math.round((currentStreak / nextMilestone.days) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full bg-gradient-to-r ${nextMilestone.color} transition-all duration-500`}
                  style={{ width: `${Math.min((currentStreak / nextMilestone.days) * 100, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-3">
              {daysToNext > 0 ? `Just ${daysToNext} more ${daysToNext === 1 ? 'day' : 'days'} to unlock ${nextMilestone.icon} ${nextMilestone.title}!` : `You've reached ${nextMilestone.title}! 🎉`}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
            <p className="text-center font-medium text-gray-900 dark:text-white">
              {dailyMessage}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Last 30 Days
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {last30Days.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {day.dayName}
                  </div>
                  <div
                    title={
                      day.hasCheckIn
                        ? `${day.date} - Checked in ✓`
                        : day.isFuture
                        ? `${day.date} - Future Day`
                        : `${day.date} - Missed ✗` // This covers today if not checked in, and past days if not checked in
                    }
                    className={`w-full aspect-square rounded-lg transition-all hover:scale-110 flex items-center justify-center text-lg font-bold ${
                      day.hasCheckIn 
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md' 
                        : day.isFuture
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                        : 'bg-gradient-to-br from-red-400 to-red-500 text-white shadow-md' // Missed (includes today if not checked in, and past days if not checked in)
                    }`}
                  >
                    {day.hasCheckIn ? <CheckCircle className="w-5 h-5" /> : day.isFuture ? '' : <X className="w-5 h-5" />}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {day.day}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-600 dark:text-gray-400">Missed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                <span className="text-gray-600 dark:text-gray-400">Future Day</span>
              </div>
            </div>
          </div>

          {achievedMilestones.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Milestones Unlocked</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {achievedMilestones.map((milestone) => (
                  <div 
                    key={milestone.days}
                    className={`p-4 bg-gradient-to-br ${milestone.color} rounded-xl text-white text-center shadow-lg`}
                  >
                    <div className="text-3xl mb-2">{milestone.icon}</div>
                    <p className="font-semibold text-sm">{milestone.title}</p>
                    <p className="text-xs opacity-90">{milestone.days} Days</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
