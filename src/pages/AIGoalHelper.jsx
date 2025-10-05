import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Goal } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Target,
  ArrowRight,
  CheckCircle,
  Crown,
  AlertCircle,
  Brain
} from "lucide-react";

export default function AIGoalHelperPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const generateGoal = async () => {
    setError(null);
    const isLitePlan = user?.plan === "lite" || !user?.plan;
    
    if (isLitePlan && usageCount >= 2) {
      setError("Lite plan: 2 AI goal suggestions per day. Upgrade to Pro for unlimited!");
      return;
    }

    if (!context || context.trim().length < 10) {
      setError("Please tell us more about your needs (at least 10 characters)");
      return;
    }

    setIsGenerating(true);
    
    try {
      const focusAreas = userProfile?.focus_areas || [];
      const prompt = `You are a helpful self-improvement coach. Based on the user's context and focus areas, suggest a SMART goal with actionable steps.

User's Focus Areas: ${focusAreas.join(', ')}
User's Context: ${context}

Please provide:
1. A clear, specific goal (one sentence)
2. 3-5 milestones to track progress
3. 3-5 daily tasks to help achieve the goal
4. A simple weekly plan (2-3 sentences)

Format your response as JSON with keys: goal, milestones (array), daily_tasks (array), weekly_plan (string)`;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            goal: { type: "string" },
            milestones: { type: "array", items: { type: "string" } },
            daily_tasks: { type: "array", items: { type: "string" } },
            weekly_plan: { type: "string" }
          }
        }
      });

      setSuggestion(response);
      setUsageCount(usageCount + 1);
    } catch (error) {
      console.error("Error generating goal:", error);
      setError("Could not generate goal suggestion. Try again.");
    }
    
    setIsGenerating(false);
  };

  const acceptSuggestion = async () => {
    if (!suggestion) return;
    
    try {
      await Goal.create({
        created_by: user.email,
        title: suggestion.goal,
        description: `${suggestion.weekly_plan}\n\nMilestones:\n${suggestion.milestones.join('\n')}`,
        type: "weekly",
        category: userProfile?.focus_areas?.[0] || "productivity",
        completed: false
      });

      navigate(createPageUrl("Goals"));
    } catch (error) {
      console.error("Error creating goal:", error);
      setError("Could not create goal. Try again.");
    }
  };

  const isLitePlan = user?.plan === "lite" || !user?.plan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Need help picking a goal?
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            AI-powered suggestions tailored to your needs
            {isLitePlan && ` (${usageCount}/2 uses today)`}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLitePlan && usageCount >= 2 && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <Crown className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Go Pro for unlimited AI goal help!
            </AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {!suggestion ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-500" />
                    Tell us about your needs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Textarea
                      placeholder="Example: I want better focus and sleep. I struggle to stay off my phone at night and feel tired during the day..."
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      className="min-h-48 rounded-xl"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {context.length}/500 characters
                    </p>
                  </div>

                  {userProfile?.focus_areas && userProfile.focus_areas.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Your Focus Areas:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.focus_areas.map((area) => (
                          <Badge key={area} variant="outline" className="capitalize rounded-lg">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    size="lg"
                    onClick={generateGoal}
                    disabled={isGenerating || !context || (isLitePlan && usageCount >= 2)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Suggest a Goal
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="suggestion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-6 h-6 text-blue-500" />
                      Your Personalized Goal
                    </CardTitle>
                    <Button variant="ghost" onClick={() => setSuggestion(null)}>
                      Try Again
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                      {suggestion.goal}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {suggestion.weekly_plan}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Milestones
                    </h4>
                    <ul className="space-y-2">
                      {suggestion.milestones.map((milestone, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      Daily Tasks
                    </h4>
                    <ul className="space-y-2">
                      {suggestion.daily_tasks.map((task, i) => (
                        <li key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSuggestion(null)}
                      className="flex-1 rounded-xl"
                    >
                      Start Over
                    </Button>
                    <Button
                      onClick={acceptSuggestion}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 rounded-xl"
                    >
                      Use This Plan
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}