
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Habit } from "@/api/entities";
import { Goal } from "@/api/entities";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Sparkles, Plus, Lightbulb } from "lucide-react";

export default function HabitRecommendationsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const generateRecommendations = useCallback((profile, goals, existingHabits) => {
    const focusAreas = profile?.focus_areas || [];
    const existingHabitNames = existingHabits.map(h => h.name.toLowerCase());
    
    const habitDatabase = {
      health: [
        { name: "Drink 8 glasses of water", emoji: "💧", reason: "Supports your health goals" },
        { name: "Take vitamins daily", emoji: "💊", reason: "Boost your immune system" },
        { name: "Walk 10,000 steps", emoji: "🚶", reason: "Improve cardiovascular health" }
      ],
      fitness: [
        { name: "Morning stretches (10 min)", emoji: "🧘", reason: "Increase flexibility" },
        { name: "Workout 30 minutes", emoji: "💪", reason: "Build strength and endurance" },
        { name: "Track meals", emoji: "🍎", reason: "Support fitness goals" }
      ],
      mindset: [
        { name: "Morning meditation (5 min)", emoji: "🧘‍♂️", reason: "Improve mental clarity" },
        { name: "Gratitude journaling", emoji: "📝", reason: "Cultivate positive mindset" },
        { name: "Affirmations practice", emoji: "✨", reason: "Boost self-confidence" }
      ],
      productivity: [
        { name: "Plan tomorrow tonight", emoji: "📅", reason: "Start each day organized" },
        { name: "Time-block calendar", emoji: "⏰", reason: "Maximize your productive hours" },
        { name: "Clear email inbox", emoji: "📧", reason: "Reduce mental clutter" }
      ],
      focus: [
        { name: "Pomodoro technique (25/5)", emoji: "🍅", reason: "Enhance deep work sessions" },
        { name: "Digital detox hour", emoji: "📱", reason: "Reduce distractions" },
        { name: "Single-tasking practice", emoji: "🎯", reason: "Improve concentration" }
      ],
      relationships: [
        { name: "Call a friend/family", emoji: "📞", reason: "Strengthen connections" },
        { name: "Express appreciation", emoji: "💖", reason: "Build positive relationships" },
        { name: "Active listening practice", emoji: "👂", reason: "Deepen understanding" }
      ],
      learning: [
        { name: "Read 20 pages", emoji: "📚", reason: "Expand your knowledge" },
        { name: "Learn new skill (30 min)", emoji: "🎓", reason: "Personal growth" },
        { name: "Watch educational content", emoji: "🎬", reason: "Stay curious" }
      ],
      creativity: [
        { name: "Morning pages writing", emoji: "✍️", reason: "Unlock creative thinking" },
        { name: "Doodle or sketch", emoji: "🎨", reason: "Express yourself visually" },
        { name: "Brainstorm new ideas", emoji: "💡", reason: "Foster innovation" }
      ],
      happiness: [
        { name: "Do something fun", emoji: "😄", reason: "Prioritize joy" },
        { name: "Practice self-compassion", emoji: "💝", reason: "Be kind to yourself" },
        { name: "Celebrate small wins", emoji: "🎉", reason: "Acknowledge progress" }
      ],
      sleep: [
        { name: "Sleep by 10 PM", emoji: "😴", reason: "Improve sleep quality" },
        { name: "No screens 1hr before bed", emoji: "📵", reason: "Better rest" },
        { name: "Evening wind-down routine", emoji: "🌙", reason: "Signal bedtime to body" }
      ]
    };

    let recommendations = [];
    
    // Priority 1: Habits matching focus areas
    focusAreas.forEach(area => {
      if (habitDatabase[area]) {
        habitDatabase[area].forEach(habit => {
          if (!existingHabitNames.includes(habit.name.toLowerCase())) {
            recommendations.push({ ...habit, category: area, priority: "high" });
          }
        });
      }
    });

    // Priority 2: Habits from other categories (for diversity)
    Object.keys(habitDatabase).forEach(category => {
      if (!focusAreas.includes(category)) {
        habitDatabase[category].forEach(habit => {
          if (!existingHabitNames.includes(habit.name.toLowerCase())) {
            recommendations.push({ ...habit, category, priority: "medium" });
          }
        });
      }
    });

    // Sort by priority and return unique habits
    return recommendations
      .sort((a, b) => a.priority === "high" ? -1 : 1)
      .filter((habit, index, self) => 
        index === self.findIndex(h => h.name === habit.name)
      );
  }, []);

  const loadRecommendations = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      const goals = await Goal.filter({ created_by: currentUser.email, completed: false });
      const existingHabits = await Habit.filter({ created_by: currentUser.email });
      
      // Generate smart recommendations based on focus areas and goals
      const recs = generateRecommendations(profiles[0], goals, existingHabits);
      setRecommendations(recs.slice(0, 10)); // Limit to 10

      if (window.gtag) {
        window.gtag('event', 'habit_recommendation_viewed', { count: recs.length });
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
    }
    setIsLoading(false);
  }, [generateRecommendations]); // Add generateRecommendations to dependencies

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]); // Add loadRecommendations to dependencies

  const handleAddHabit = async (recommendedHabit) => {
    try {
      await Habit.create({
        name: recommendedHabit.name,
        category: recommendedHabit.category,
        icon: recommendedHabit.emoji,
        is_active: true
      });

      setRecommendations(recommendations.filter(h => h.name !== recommendedHabit.name));
    } catch (error) {
      console.error("Error adding habit:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Suggested Habits
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Based on your goals and focus areas
            </p>
          </div>
        </div>

        {userProfile?.focus_areas?.length > 0 && (
          <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Showing top 10 habits tailored to your focus on: {userProfile.focus_areas.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {recommendations.map((habit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{habit.emoji}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {habit.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {habit.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {habit.category}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleAddHabit(habit)}
                      className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Habit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {recommendations.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                You've already added all our recommended habits! Great job building your routine.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
