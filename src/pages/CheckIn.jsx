
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { DailyCheckIn } from "@/api/entities";
import { Habit } from "@/api/entities";
import { format, startOfToday, differenceInCalendarDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Sparkles, ArrowLeft, Crown } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { fetchConfig } from "@/components/utils/gamification";

const moods = [
  { value: "very_sad", emoji: "😞", label: "Very Sad", scale: 1 },
  { value: "sad", emoji: "😐", label: "Sad", scale: 2 },
  { value: "neutral", emoji: "🙂", label: "Okay", scale: 3 },
  { value: "happy", emoji: "😃", label: "Happy", scale: 4 },
  { value: "very_happy", emoji: "🤩", label: "Amazing", scale: 5 }
];

export default function CheckInPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [habits, setHabits] = useState([]);
  const [completedHabits, setCompletedHabits] = useState([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCheckIn, setExistingCheckIn] = useState(null);
  const [planWarning, setPlanWarning] = useState(null);
  const [habitCap, setHabitCap] = useState(5);

  const loadCheckInData = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Get config for habit cap
      const config = await fetchConfig();
      setHabitCap(config.habitCap || 5);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      let currentUserProfile = null;
      if (profiles.length > 0) {
        currentUserProfile = profiles[0];
        setUserProfile(currentUserProfile);
      }

      const today = format(startOfToday(), 'yyyy-MM-dd');
      const checkIns = await DailyCheckIn.filter({ created_by: currentUser.email, date: today });
      
      if (checkIns.length > 0) {
        setExistingCheckIn(checkIns[0]);
        const moodData = moods.find(m => m.value === checkIns[0].mood);
        setSelectedMood(moodData?.scale || null);
        setCompletedHabits(checkIns[0].habits_completed || []);
        setNotes(checkIns[0].notes || "");
      }

      const allHabits = await Habit.filter({ created_by: currentUser.email, is_active: true });
      const userFocusAreas = currentUserProfile?.focus_areas || [];
      
      // Deduplicate and prioritize by focus areas
      const uniqueHabitsMap = new Map();
      const priorityHabits = allHabits.filter(h => userFocusAreas.includes(h.category));
      const otherHabits = allHabits.filter(h => !userFocusAreas.includes(h.category));
      
      [...priorityHabits, ...otherHabits].forEach(habit => {
        const key = habit.name.toLowerCase().trim();
        if (!uniqueHabitsMap.has(key)) {
          uniqueHabitsMap.set(key, habit);
        }
      });
      
      setHabits(Array.from(uniqueHabitsMap.values()));
    } catch (error) {
      console.error("Error loading check-in data:", error);
      toast.error("Could not load check-in data. Please try again.");
    }
  }, [toast]);

  useEffect(() => {
    loadCheckInData();
  }, [loadCheckInData]);

  const toggleHabit = (habitId) => {
    if (completedHabits.includes(habitId)) {
      setCompletedHabits(completedHabits.filter(id => id !== habitId));
      setPlanWarning(null);
    } else {
      if (completedHabits.length >= habitCap) {
        setPlanWarning(`You can track up to ${habitCap} habits per day. Upgrade to Pro for unlimited!`);
        return;
      }
      setCompletedHabits([...completedHabits, habitId]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast.error("Please select your mood");
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = await User.me();
      if (!currentUser) throw new Error("User not found. Please log in.");
      
      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length === 0) throw new Error("User profile not found.");
      const userProfile = profiles[0];

      const selectedMoodData = moods.find(m => m.scale === selectedMood);
      if (!selectedMoodData) throw new Error("Invalid mood selected.");
      
      const today = format(startOfToday(), 'yyyy-MM-dd');

      // Check if a check-in for today already exists
      const existingCheckIns = await DailyCheckIn.filter({ created_by: currentUser.email, date: today });
      const existingCheckInForToday = existingCheckIns[0] || null;

      const checkInData = {
        date: today,
        mood: selectedMoodData.value,
        mood_emoji: selectedMoodData.emoji,
        habits_completed: completedHabits,
        notes: notes,
        points_earned: 10, // Base points for a check-in
        created_by: currentUser.email,
      };

      if (existingCheckInForToday) {
        // Update existing check-in
        await DailyCheckIn.update(existingCheckInForToday.id, checkInData);
        toast.success("Check-in updated!");
      } else {
        // Create new check-in and update user profile for streaks and points
        let newStreak = userProfile.current_streak || 0;
        let newLongestStreak = userProfile.longest_streak || 0;
        let newPoints = userProfile.total_points || 0;

        // Fetch all check-ins to determine streak
        const allCheckIns = await DailyCheckIn.filter({ created_by: currentUser.email }, '-date'); // Sorted by date descending
        const lastCheckIn = allCheckIns[0]; // Most recent check-in before today

        const todayDateObj = startOfToday();
        
        if (lastCheckIn) {
          const lastCheckInDateObj = new Date(lastCheckIn.date);
          const daysDifference = differenceInCalendarDays(todayDateObj, lastCheckInDateObj);

          if (daysDifference === 1) {
            newStreak += 1; // Consecutive day
          } else if (daysDifference > 1) {
            newStreak = 1; // Streak broken, new streak starts today
          } else {
            // This case ideally shouldn't happen if existingCheckInForToday is null,
            // but for safety, if lastCheckIn is today, streak is 1.
            newStreak = 1; 
          }
        } else {
          newStreak = 1; // First ever check-in, start streak at 1
        }
        
        if (newStreak > newLongestStreak) {
          newLongestStreak = newStreak;
        }

        newPoints += 10; // 10 points for check-in
        if(newStreak > 1) newPoints += Math.min(newStreak, 10); // Streak bonus: 1-10 points

        await DailyCheckIn.create(checkInData);
        await UserProfile.update(userProfile.id, {
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          total_points: newPoints
        });
        
        toast.success(`Check-in complete! Streak: ${newStreak} days 🔥`);
      }

      // Navigate back to dashboard
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 1000);

    } catch (error) {
      console.error("Error submitting check-in:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLitePlan = habitCap === 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              How Do You Feel Today?
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {existingCheckIn ? "Update your check-in" : "Track your mood and habits"}
            </p>
          </div>
        </div>

        {planWarning && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
            <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              {planWarning}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Select your mood (1-5 scale)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3">
                  {moods.map((mood) => (
                    <motion.button
                      key={mood.scale}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMood(mood.scale)}
                      className={`p-4 rounded-2xl transition-all duration-300 ${
                        selectedMood === mood.scale
                          ? 'bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-xl'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-4xl mb-2">{mood.emoji}</div>
                      <p className={`text-xs font-medium ${selectedMood !== mood.scale && 'text-gray-600 dark:text-gray-400'}`}>
                        {mood.scale}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {habits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      Mark Habits Done
                      {isLitePlan && (
                        <span className="text-xs px-2 py-1 bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 rounded-full flex items-center gap-1 font-semibold">
                          <Crown className="w-3 h-3 fill-current" />
                          Lite
                        </span>
                      )}
                    </CardTitle>
                    {isLitePlan && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {completedHabits.length} / {habitCap} max
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {habits.slice(0, 10).map((habit) => {
                      const isCompleted = completedHabits.includes(habit.id);
                      const isDisabled = !isCompleted && completedHabits.length >= habitCap;
                      
                      return (
                        <motion.button
                          key={habit.id}
                          whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                          whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                          onClick={() => !isDisabled && toggleHabit(habit.id)}
                          disabled={isDisabled}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                            isCompleted
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg'
                              : isDisabled
                              ? 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <span className="text-2xl">{habit.icon || "✓"}</span>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`font-medium ${!isCompleted && !isDisabled && 'text-gray-900 dark:text-white'}`}>
                              {habit.name}
                            </p>
                            <p className={`text-sm ${isCompleted ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                              {habit.current_streak || 0} day streak
                            </p>
                          </div>
                          {isDisabled && (
                            <Crown className="w-5 h-5 text-yellow-500" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Write a Short Note (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="How was your day? Any thoughts to share?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-32 rounded-xl"
                  maxLength={2000}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!selectedMood || isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl py-6 text-lg shadow-xl"
            >
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Sparkles className="mr-2 w-5 h-5" />
                  {existingCheckIn ? "Update Check-In" : "Save Today"}
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
