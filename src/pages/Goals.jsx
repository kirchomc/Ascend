
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Goal } from "@/api/entities";
import { Habit } from "@/api/entities";
import { Challenge } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Target,
  Plus,
  CheckCircle,
  Circle,
  Trash2,
  Calendar,
  Edit,
  X,
  AlertCircle,
  Crown,
  Sparkles,
  Lightbulb
} from "lucide-react";
import { format } from "date-fns";
import { useGamificationUpdates } from "@/components/utils/gamification";

const categories = [
  { value: "health", label: "Health", color: "bg-red-100 text-red-800" },
  { value: "fitness", label: "Fitness", color: "bg-orange-100 text-orange-800" },
  { value: "mindset", label: "Mindset", color: "bg-purple-100 text-purple-800" },
  { value: "productivity", label: "Productivity", color: "bg-blue-100 text-blue-800" },
  { value: "focus", label: "Focus", color: "bg-yellow-100 text-yellow-800" },
  { value: "relationships", label: "Relationships", color: "bg-green-100 text-green-800" },
  { value: "learning", label: "Learning", color: "bg-teal-100 text-teal-800" },
  { value: "creativity", label: "Creativity", color: "bg-pink-100 text-pink-800" },
  { value: "happiness", label: "Happiness", color: "bg-amber-100 text-amber-800" },
  { value: "sleep", label: "Sleep", color: "bg-indigo-100 text-indigo-800" }
];

export default function GoalsPage() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "weekly",
    category: "productivity",
    due_date: ""
  });
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const loadGoalsData = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      const userGoals = await Goal.filter({ created_by: currentUser.email }, '-created_date');
      setGoals(userGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
      setError("Failed to load goals. Please try refreshing the page.");
    }
  }, []);

  useEffect(() => {
    loadGoalsData();
  }, [loadGoalsData]);

  // Listen for real-time gamification updates - MUST be at top level
  useGamificationUpdates((payload) => {
    if (payload.type === 'goal_completed') {
      loadGoalsData();
    }
  });

  // AI-powered goal analysis
  const analyzeGoalDescription = async (description) => {
    if (!description || description.trim().length < 20 || editingGoal) return;
    
    setIsAnalyzing(true);
    setAiSuggestions(null); // Clear previous suggestions
    try {
      const prompt = `Analyze this goal description and suggest:
1. Recommended category from the following list (health, fitness, mindset, productivity, focus, relationships, learning, creativity, happiness, sleep)
2. 2-3 specific daily habits that would help achieve this goal. For each habit, include a suitable icon_emoji (e.g., "💧" for drink water).
3. 1 relevant challenge theme (e.g., "7-Day Water Intake Challenge")
4. 2-3 key actions for daily check-ins (e.g., "Logged water intake", "Meditated for 10 min")

Goal description: "${description}"

Respond in JSON format with:
{
  "category": "category_name",
  "habits": [
    {"name": "Habit 1 Name", "icon_emoji": "emoji"},
    {"name": "Habit 2 Name", "icon_emoji": "emoji"}
  ],
  "challenge_theme": "Challenge Theme Text",
  "check_in_actions": ["Action 1", "Action 2"]
}`;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            category: { type: "string", enum: categories.map(cat => cat.value) },
            habits: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  icon_emoji: { type: "string" }
                },
                required: ["name", "icon_emoji"]
              }
            },
            challenge_theme: { type: "string" },
            check_in_actions: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["category", "habits", "challenge_theme", "check_in_actions"]
        }
      });

      setAiSuggestions(response);
      if (response?.category) {
        setFormData(prev => ({ ...prev, category: response.category }));
      }
    } catch (error) {
      console.error("Error analyzing goal:", error);
      setError("Failed to get AI suggestions. Please try again.");
      setAiSuggestions(null);
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    const isLitePlan = user?.plan === "lite" || !user?.plan;
    const activeGoals = goals.filter(g => !g.completed);
    
    if (!editingGoal && isLitePlan && activeGoals.length >= 5) { // Changed from 1 to 5
      setError("You can have 5 active goals on Lite. Upgrade to Pro to create unlimited goals!"); // Updated error message
      return;
    }

    if (!formData.title || formData.title.trim().length === 0) {
      setError("Goal title is required.");
      return;
    }

    if (formData.title.length > 120) {
      setError("Goal title must be 120 characters or less.");
      return;
    }

    try {
      const goalData = {
        ...formData,
        created_by: user.email,
        completed: false
      };

      if (editingGoal) {
        await Goal.update(editingGoal.id, formData);
      } else {
        await Goal.create(goalData);

        // Create suggested habits if AI provided them and user is Pro
        if (aiSuggestions?.habits && user?.plan === "pro") {
          const existingHabits = await Habit.filter({ created_by: user.email });
          const existingHabitNames = new Set(existingHabits.map(h => h.name.toLowerCase()));

          for (const habit of aiSuggestions.habits) {
            // Only create if it doesn't already exist
            if (!existingHabitNames.has(habit.name.toLowerCase())) {
              await Habit.create({
                created_by: user.email,
                name: habit.name,
                category: formData.category,
                icon: habit.icon_emoji,
                current_streak: 0,
                best_streak: 0,
                is_active: true
              });
            }
          }
        }
      }
      
      setFormData({
        title: "",
        description: "",
        type: "weekly",
        category: "productivity",
        due_date: ""
      });
      setShowForm(false);
      setEditingGoal(null);
      setAiSuggestions(null); // Clear AI suggestions on successful save
      loadGoalsData();
    } catch (error) {
      console.error("Error saving goal:", error);
      setError("We could not save your goal. Please try again.");
    }
  };

  const toggleComplete = async (goal) => {
    try {
      const newCompletedStatus = !goal.completed;
      
      await Goal.update(goal.id, {
        completed: newCompletedStatus,
        completed_date: newCompletedStatus ? format(new Date(), 'yyyy-MM-dd') : null
      });

      // Update user points
      if (userProfile) {
        const pointsChange = newCompletedStatus ? 20 : -20; // 20 points for completion
        const newPoints = (userProfile.total_points || 0) + pointsChange;
        await UserProfile.update(userProfile.id, { total_points: newPoints });
      }

      loadGoalsData();
    } catch (error) {
      console.error("Error toggling goal completion:", error);
      setError("Failed to update goal completion status.");
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await Goal.delete(goalId);
      loadGoalsData();
    } catch (error) {
      console.error("Error deleting goal:", error);
      setError("Failed to delete goal.");
    }
  };

  const startEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      type: goal.type,
      category: goal.category,
      due_date: goal.due_date || ""
    });
    setShowForm(true);
    setAiSuggestions(null); // Clear AI suggestions when editing
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingGoal(null);
    setFormData({
      title: "",
      description: "",
      type: "weekly",
      category: "productivity",
      due_date: ""
    });
    setError(null);
    setAiSuggestions(null); // Clear AI suggestions on cancel
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === "all") return true;
    if (filter === "active") return !goal.completed;
    if (filter === "completed") return goal.completed;
    return true;
  });

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : "bg-gray-100 text-gray-800";
  };

  const isLitePlan = user?.plan === "lite" || !user?.plan;
  const activeGoalsCount = goals.filter(g => !g.completed).length;
  const canCreateGoal = !isLitePlan || activeGoalsCount < 5; // Changed from 1 to 5

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              My Goals
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Set and track your goals
              {isLitePlan && user && ` (${activeGoalsCount}/5 active)`} {/* Updated count display */}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => canCreateGoal ? setShowForm(true) : setError("You've reached the limit of 5 active goals on the Lite plan. Upgrade to Pro to create unlimited goals!")} // Updated error message
            disabled={showForm && !editingGoal}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Goal
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="dark:text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {!canCreateGoal && !showForm && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
            <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              You've reached the limit of 5 active goals on Lite. Upgrade to Pro for unlimited goals! {/* Updated alert message */}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="rounded-xl"
          >
            All
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
            className="rounded-xl"
          >
            Active
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
            className="rounded-xl"
          >
            Completed
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={cancelEdit}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Goal Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Example: Drink water every day"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        maxLength={120}
                        className="rounded-xl"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.title.length}/120 characters
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        Description (optional)
                        {user?.plan === "pro" && (
                          <>
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span className="text-xs text-purple-600 dark:text-purple-400">
                              (AI will analyze and suggest habits for Pro users)
                            </span>
                          </>
                        )}
                      </label>
                      <Textarea
                        placeholder="Add more details about your goal... (e.g., 'I want to improve my sleep by going to bed earlier and avoiding screens')"
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                        }}
                        onBlur={() => user?.plan === "pro" && !editingGoal && analyzeGoalDescription(formData.description)}
                        className="rounded-xl min-h-24"
                        disabled={isAnalyzing}
                      />
                      {isAnalyzing && (
                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          Analyzing your goal...
                        </p>
                      )}
                    </div>

                    {aiSuggestions && user?.plan === "pro" && (
                      <Alert className="border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                        <Lightbulb className="h-4 w-4 text-purple-600" />
                        <AlertDescription>
                          <p className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                            AI Suggestions
                          </p>
                          <div className="space-y-2 text-sm">
                            {aiSuggestions.habits?.length > 0 && (
                              <p className="text-purple-700 dark:text-purple-300">
                                <strong>Habits to add:</strong> {aiSuggestions.habits.map(h => `${h.icon_emoji} ${h.name}`).join(', ')}
                              </p>
                            )}
                            {aiSuggestions.challenge_theme && (
                              <p className="text-purple-700 dark:text-purple-300">
                                <strong>Challenge theme:</strong> {aiSuggestions.challenge_theme}
                              </p>
                            )}
                            {aiSuggestions.check_in_actions?.length > 0 && (
                              <p className="text-purple-700 dark:text-purple-300">
                                <strong>Check-in focus:</strong> {aiSuggestions.check_in_actions.join(', ')}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-purple-500 dark:text-purple-400 mt-2">
                            *Suggested habits will be automatically created upon saving this goal.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Type</label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Category</label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Due Date</label>
                        <Input
                          type="date"
                          value={formData.due_date}
                          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <Button type="button" variant="outline" onClick={cancelEdit} className="rounded-xl" disabled={isAnalyzing}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 rounded-xl" disabled={isAnalyzing}>
                        {editingGoal ? "Update Goal" : "Save Goal"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleComplete(goal)}
                        className="flex-shrink-0 mt-1"
                      >
                        {goal.completed ? (
                          <CheckCircle className="w-7 h-7 text-green-500" />
                        ) : (
                          <Circle className="w-7 h-7 text-gray-400" />
                        )}
                      </Button>

                      <div className="flex-1">
                        <h3 className={`text-xl font-semibold mb-2 ${goal.completed && 'line-through text-gray-500'}`}>
                          {goal.title}
                        </h3>
                        {goal.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {goal.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-lg">
                            {goal.type}
                          </Badge>
                          <Badge className={`${getCategoryColor(goal.category)} border-0 rounded-lg`}>
                            {goal.category}
                          </Badge>
                          {goal.due_date && (
                            <Badge variant="outline" className="flex items-center gap-1 rounded-lg">
                              <Calendar className="w-3 h-3" />
                              Due: {format(new Date(goal.due_date), 'MMM d, yyyy')}
                            </Badge>
                          )}
                          {goal.completed && goal.completed_date && (
                            <Badge className="bg-green-100 text-green-800 border-0 rounded-lg">
                              ✓ Completed {format(new Date(goal.completed_date), 'MMM d')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(goal)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGoal(goal.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredGoals.length === 0 && (
            <Card className="shadow-lg">
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  No goals yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start by creating your first goal to track your progress!
                </p>
                <Button
                  onClick={() => canCreateGoal ? setShowForm(true) : setError("You've reached the limit of 5 active goals on the Lite plan. Upgrade to Pro to create unlimited goals!")} // Updated error message
                  disabled={!canCreateGoal}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
