import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Habit } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Brain,
  Target,
  Users,
  Zap,
  Moon,
  Dumbbell,
  BookOpen,
  Lightbulb,
  Smile,
  Sparkles,
  ArrowRight,
  Clock
} from "lucide-react";

const focusAreas = [
  { id: "health", name: "Health", icon: Heart, color: "from-red-400 to-pink-500" },
  { id: "mindset", name: "Mindset", icon: Brain, color: "from-purple-400 to-indigo-500" },
  { id: "productivity", name: "Productivity", icon: Target, color: "from-blue-400 to-cyan-500" },
  { id: "relationships", name: "Relationships", icon: Users, color: "from-green-400 to-emerald-500" },
  { id: "focus", name: "Focus", icon: Zap, color: "from-yellow-400 to-orange-500" },
  { id: "sleep", name: "Sleep", icon: Moon, color: "from-indigo-400 to-purple-500" },
  { id: "fitness", name: "Fitness", icon: Dumbbell, color: "from-orange-400 to-red-500" },
  { id: "learning", name: "Learning", icon: BookOpen, color: "from-teal-400 to-cyan-500" },
  { id: "creativity", name: "Creativity", icon: Lightbulb, color: "from-pink-400 to-rose-500" },
  { id: "happiness", name: "Happiness", icon: Smile, color: "from-yellow-400 to-amber-500" }
];

const reminderTimes = [
  { value: "morning", label: "Morning", time: "8:00 AM", icon: "🌅" },
  { value: "afternoon", label: "Afternoon", time: "2:00 PM", icon: "☀️" },
  { value: "evening", label: "Evening", time: "7:00 PM", icon: "🌙" }
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [reminderTime, setReminderTime] = useState("morning");
  const [isCreating, setIsCreating] = useState(false);

  const toggleArea = (areaId) => {
    if (selectedAreas.includes(areaId)) {
      setSelectedAreas(selectedAreas.filter(id => id !== areaId));
    } else if (selectedAreas.length < 5) {
      setSelectedAreas([...selectedAreas, areaId]);
    }
  };

  const completeOnboarding = async () => {
    setIsCreating(true);
    try {
      const user = await User.me();
      
      const profile = await UserProfile.create({
        created_by: user.email,
        focus_areas: selectedAreas,
        daily_reminder_time: reminderTime,
        current_streak: 0,
        longest_streak: 0,
        total_points: 0,
        onboarding_completed: true
      });

      const defaultHabits = {
        health: [{ name: "Drink 8 glasses of water", icon: "💧" }],
        fitness: [{ name: "Exercise for 30 minutes", icon: "💪" }],
        mindset: [{ name: "Practice gratitude", icon: "🙏" }],
        sleep: [{ name: "Sleep 8 hours", icon: "😴" }],
        focus: [{ name: "Deep work session", icon: "🎯" }]
      };

      for (const area of selectedAreas) {
        if (defaultHabits[area]) {
          for (const habit of defaultHabits[area]) {
            await Habit.create({
              created_by: user.email,
              name: habit.name,
              category: area,
              icon: habit.icon,
              current_streak: 0,
              best_streak: 0,
              is_active: true
            });
          }
        }
      }

      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-2xl"
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                Welcome to GrowthPath
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
                Your personal companion for building better habits, achieving goals, and becoming the best version of yourself
              </p>
              
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-6 text-lg rounded-2xl shadow-xl"
                onClick={() => setStep(2)}
              >
                Let's Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
                  Choose Your Focus Areas
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Select up to 5 areas you want to improve
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {selectedAreas.length} of 5 selected
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {focusAreas.map((area) => {
                  const Icon = area.icon;
                  const isSelected = selectedAreas.includes(area.id);
                  const isDisabled = !isSelected && selectedAreas.length >= 5;
                  
                  return (
                    <motion.button
                      key={area.id}
                      whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                      whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                      onClick={() => !isDisabled && toggleArea(area.id)}
                      disabled={isDisabled}
                      className={`p-6 rounded-2xl transition-all duration-300 ${
                        isSelected
                          ? `bg-gradient-to-br ${area.color} text-white shadow-xl`
                          : isDisabled
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 opacity-50 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-800 hover:shadow-lg border-2 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${!isSelected && !isDisabled && 'text-gray-600 dark:text-gray-400'}`} />
                      <p className={`font-medium text-sm ${!isSelected && !isDisabled && 'text-gray-900 dark:text-gray-200'}`}>
                        {area.name}
                      </p>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="rounded-xl"
                >
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={() => setStep(3)}
                  disabled={selectedAreas.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl"
                >
                  Continue
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <Clock className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                <h2 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
                  Daily Reminder
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  When would you like to receive your daily motivation?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
                {reminderTimes.map((time) => (
                  <motion.button
                    key={time.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setReminderTime(time.value)}
                    className={`p-8 rounded-2xl transition-all duration-300 ${
                      reminderTime === time.value
                        ? 'bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-xl'
                        : 'bg-white dark:bg-gray-800 hover:shadow-lg border-2 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-4xl mb-3">{time.icon}</div>
                    <p className={`font-bold text-xl mb-1 ${reminderTime !== time.value && 'text-gray-900 dark:text-white'}`}>
                      {time.label}
                    </p>
                    <p className={`text-sm ${reminderTime === time.value ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                      Around {time.time}
                    </p>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(2)}
                  className="rounded-xl"
                >
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={completeOnboarding}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl px-8"
                >
                  {isCreating ? "Setting up..." : "Complete Setup"}
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-2 mt-12">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step 
                  ? 'w-8 bg-gradient-to-r from-blue-500 to-green-500' 
                  : s < step
                  ? 'w-2 bg-green-500'
                  : 'w-2 bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}