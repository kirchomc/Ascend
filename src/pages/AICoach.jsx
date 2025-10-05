import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Goal } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Brain,
  Target,
  Lightbulb,
  TrendingUp,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function AICoachPage() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [coachStyle, setCoachStyle] = useState("Gentle");
  const [dailyPlan, setDailyPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [usesToday, setUsesToday] = useState(0);
  const maxUsesPerDay = 2; // Lite limit, can be upgraded

  const coachStyles = [
    {
      value: "Gentle",
      label: "Gentle & Supportive",
      description: "Encouraging and patient approach",
      icon: "💚"
    },
    {
      value: "Tough Love",
      label: "Tough Love",
      description: "Direct and challenging motivation",
      icon: "💪"
    },
    {
      value: "Data-Driven",
      label: "Data-Driven",
      description: "Analytical and metric-focused",
      icon: "📊"
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      // Load today's coach uses (in production, this would be from backend)
      const today = new Date().toDateString();
      const savedDate = localStorage.getItem('coach_uses_date');
      if (savedDate === today) {
        setUsesToday(parseInt(localStorage.getItem('coach_uses_count') || '0'));
      } else {
        localStorage.setItem('coach_uses_date', today);
        localStorage.setItem('coach_uses_count', '0');
        setUsesToday(0);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const generatePlan = async () => {
    if (usesToday >= maxUsesPerDay) {
      toast.error("You've reached your daily limit. Upgrade to Pro for unlimited coach access!");
      return;
    }

    try {
      setGenerating(true);

      const focusAreas = userProfile?.focus_areas || [];
      const currentStreak = userProfile?.current_streak || 0;
      const totalPoints = userProfile?.total_points || 0;

      const stylePrompts = {
        "Gentle": "Be warm, encouraging, and supportive. Focus on small wins and positive reinforcement.",
        "Tough Love": "Be direct, challenging, and no-nonsense. Push for higher standards and accountability.",
        "Data-Driven": "Be analytical and metric-focused. Use data and statistics to guide recommendations."
      };

      const prompt = `You are an AI personal development coach with a ${coachStyle} style. ${stylePrompts[coachStyle]}

User Context:
- Focus areas: ${focusAreas.join(', ') || 'general wellness'}
- Current streak: ${currentStreak} days
- Total points: ${totalPoints}

Create a personalized daily plan with:
1. A brief motivational summary (2-3 sentences)
2. 3 specific daily goals for today
3. One focused tip related to their main challenge

Response format:
{
  "summary": "Your motivational message",
  "daily_goals": ["Goal 1", "Goal 2", "Goal 3"],
  "focus_tip": "One actionable tip"
}`;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            daily_goals: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 3
            },
            focus_tip: { type: "string" }
          },
          required: ["summary", "daily_goals", "focus_tip"]
        }
      });

      setDailyPlan(response);
      
      // Increment usage count
      const newCount = usesToday + 1;
      setUsesToday(newCount);
      localStorage.setItem('coach_uses_count', newCount.toString());

      toast.success("Your personalized plan is ready!");

      if (window.gtag) {
        window.gtag('event', 'coach_plan_generated', {
          style: coachStyle,
          len_goals: response.daily_goals.length
        });
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error("Failed to generate plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const applyPlan = async () => {
    if (!dailyPlan) return;

    try {
      // Create goals from the plan
      for (const goalText of dailyPlan.daily_goals) {
        await Goal.create({
          title: goalText,
          type: "daily",
          category: userProfile?.focus_areas?.[0] || "productivity",
          status: "active"
        });
      }

      toast.success("Goals added to your dashboard!");

      if (window.gtag) {
        window.gtag('event', 'coach_plan_applied', {
          style: coachStyle,
          goals_count: dailyPlan.daily_goals.length
        });
      }
    } catch (error) {
      console.error("Error applying plan:", error);
      toast.error("Failed to apply plan. Please try again.");
    }
  };

  const remainingUses = maxUsesPerDay - usesToday;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Your AI Coach
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Get personalized guidance for your journey
              </p>
            </div>
          </div>

          {remainingUses <= 0 && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-900/20 mt-4">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                You've used all {maxUsesPerDay} daily coach sessions. Upgrade to Pro for unlimited access!
              </AlertDescription>
            </Alert>
          )}

          {remainingUses > 0 && remainingUses < maxUsesPerDay && (
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20 mt-4">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                You have {remainingUses} coach session{remainingUses !== 1 ? 's' : ''} remaining today
              </AlertDescription>
            </Alert>
          )}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {coachStyles.map((style) => (
            <Card
              key={style.value}
              className={`cursor-pointer transition-all ${
                coachStyle === style.value
                  ? 'ring-2 ring-purple-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setCoachStyle(style.value)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">{style.icon}</div>
                <h3 className="font-semibold mb-1">{style.label}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {style.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Generate Your Plan
              </span>
              <Badge variant="outline">
                {remainingUses}/{maxUsesPerDay} left today
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              onClick={generatePlan}
              disabled={generating || remainingUses <= 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Your Plan...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Generate {coachStyle} Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {dailyPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Today's Guidance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {dailyPlan.summary}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Your Daily Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyPlan.daily_goals.map((goal, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <p className="flex-1 text-gray-800 dark:text-gray-200 pt-1">
                        {goal}
                      </p>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  onClick={applyPlan}
                  className="w-full mt-6 rounded-xl"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Apply Plan to Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Focus Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  💡 {dailyPlan.focus_tip}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}