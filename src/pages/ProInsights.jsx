import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Goal } from "@/api/entities";
import { DailyCheckIn } from "@/api/entities";
import { Habit } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Crown, 
  Sparkles,
  TrendingUp,
  Lightbulb,
  Target,
  Calendar,
  Zap,
  FileText
} from "lucide-react";

export default function ProInsightsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      
      if (currentUser.plan !== 'full') {
        navigate(createPageUrl('PremiumPortal'));
        return;
      }

      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      // Auto-generate insights on load
      await generateInsights(currentUser.email);
      
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async (userEmail) => {
    setGenerating(true);
    try {
      const [goals, checkIns, habits] = await Promise.all([
        Goal.filter({ created_by: userEmail }),
        DailyCheckIn.filter({ created_by: userEmail }),
        Habit.filter({ created_by: userEmail })
      ]);

      const completedGoals = goals.filter(g => g.completed);
      const activeGoals = goals.filter(g => !g.completed);
      const recentCheckIns = checkIns.slice(0, 14); // Last 2 weeks
      
      const prompt = `
You are an AI coach analyzing a user's personal growth journey. Based on the following data, provide personalized insights and recommendations:

Goals (${goals.length} total):
- Completed: ${completedGoals.length}
- Active: ${activeGoals.length}
- Categories: ${[...new Set(goals.map(g => g.category))].join(', ')}

Recent Activity (last 14 days):
- Check-ins: ${recentCheckIns.length}
- Active Habits: ${habits.filter(h => h.is_active).length}

Provide a JSON response with:
{
  "overall_assessment": "Brief overall assessment of progress (2-3 sentences)",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areas_for_improvement": ["area 1", "area 2"],
  "recommendations": [
    {"title": "recommendation title", "description": "detailed description", "priority": "high|medium|low"},
    ...3-4 recommendations
  ],
  "motivation_message": "Encouraging message (2-3 sentences)",
  "predicted_next_milestone": "What milestone they're likely to achieve next"
}
`;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            areas_for_improvement: { type: "array", items: { type: "string" } },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            motivation_message: { type: "string" },
            predicted_next_milestone: { type: "string" }
          }
        }
      });

      setInsights(response);
    } catch (error) {
      console.error("Error generating insights:", error);
      alert("Failed to generate insights. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Progress Insights & Reports
              </h1>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 mt-1">
                <Crown className="w-3 h-3 mr-1" />
                Pro Feature
              </Badge>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            AI-powered insights into your personal growth journey
          </p>
        </motion.div>

        {generating && (
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Analyzing your progress and generating personalized insights...</p>
            </CardContent>
          </Card>
        )}

        {!generating && insights && (
          <>
            {/* Overall Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Alert className="mb-8 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <AlertDescription className="text-purple-900 dark:text-purple-200">
                  <strong>Overall Assessment:</strong> {insights.overall_assessment}
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Strengths */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Zap className="w-5 h-5 text-green-600" />
                    Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {insights.strengths.map((strength, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                      >
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                        <span className="text-gray-900 dark:text-white">{strength}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Areas for Improvement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Target className="w-5 h-5 text-orange-600" />
                    Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {insights.areas_for_improvement.map((area, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                      >
                        <Lightbulb className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 dark:text-white">{area}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="p-4 border-l-4 border-purple-500 bg-gray-50 dark:bg-gray-700 rounded-r-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{rec.description}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Milestone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Next Predicted Milestone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-900 dark:text-white">{insights.predicted_next_milestone}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Motivation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Alert className="border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700">
                <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-900 dark:text-green-200">
                  <strong>Keep Going!</strong> {insights.motivation_message}
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Regenerate Button */}
            <div className="mt-8 text-center">
              <Button
                onClick={() => generateInsights(user.email)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate Insights
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}