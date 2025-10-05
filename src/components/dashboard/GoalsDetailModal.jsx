
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Calendar, CheckCircle, Clock, Edit, Save, X, Plus, Trash2, Sparkles, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { Goal } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";

export default function GoalsDetailModal({ open, onClose, goals, onRefresh }) {
  const [editingGoal, setEditingGoal] = useState(null);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "weekly",
    category: "productivity",
    due_date: ""
  });
  const [aiSummary, setAiSummary] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  const goalCompletionRate = goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

  const categories = [
    { value: "health", label: "Health" },
    { value: "fitness", label: "Fitness" },
    { value: "mindset", label: "Mindset" },
    { value: "productivity", label: "Pr oductivity" },
    { value: "focus", label: "Focus" },
    { value: "relationships", label: "Relationships" },
    { value: "learning", label: "Learning" },
    { value: "creativity", label: "Creativity" },
    { value: "happiness", label: "Happiness" },
    { value: "sleep", label: "Sleep" }
  ];

  const generateAISummary = async () => {
    if (activeGoals.length === 0) return;
    
    setIsGeneratingSummary(true);
    try {
      const goalsText = activeGoals.map(g => `${g.title}: ${g.description || 'No description'}`).join('\n');
      
      const prompt = `Analyze these personal development goals and create a beautiful, concise summary. Use 3-5 bullet points maximum. Focus on main themes and key actions. Be inspiring and motivational.

Goals:
${goalsText}

Provide a JSON response with:
{
  "main_theme": "One sentence describing the overall focus",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "motivation": "One inspiring sentence"
}`;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            main_theme: { type: "string" },
            key_points: {
              type: "array",
              items: { type: "string" }
            },
            motivation: { type: "string" }
          },
          required: ["main_theme", "key_points", "motivation"]
        }
      });

      setAiSummary(response);
    } catch (error) {
      console.error("Error generating summary:", error);
    }
    setIsGeneratingSummary(false);
  };

  const startEdit = (goal) => {
    setEditingGoal(goal.id);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      type: goal.type,
      category: goal.category,
      due_date: goal.due_date || ""
    });
  };

  const cancelEdit = () => {
    setEditingGoal(null);
    setShowNewGoalForm(false);
    setFormData({
      title: "",
      description: "",
      type: "weekly",
      category: "productivity",
      due_date: ""
    });
  };

  const saveGoal = async (goalId) => {
    try {
      if (goalId) {
        await Goal.update(goalId, formData);
      } else {
        await Goal.create({ ...formData, completed: false });
        setShowNewGoalForm(false);
      }
      cancelEdit();
      onRefresh();
      // Regenerate AI summary after changes
      setTimeout(generateAISummary, 500);
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await Goal.delete(goalId);
      onRefresh();
      setTimeout(generateAISummary, 500);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const toggleComplete = async (goal) => {
    try {
      await Goal.update(goal.id, {
        completed: !goal.completed,
        completed_date: !goal.completed ? format(new Date(), 'yyyy-MM-dd') : null
      });
      onRefresh();
    } catch (error) {
      console.error("Error toggling goal:", error);
    }
  };

  React.useEffect(() => {
    if (open && activeGoals.length > 0 && !aiSummary) {
      generateAISummary();
    }
  }, [open, activeGoals.length, aiSummary]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-500" />
            Your Goals
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeGoals.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Goals</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedGoals.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
              <Clock className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(goalCompletionRate)}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
              <span className="font-semibold text-gray-900 dark:text-white">{Math.round(goalCompletionRate)}%</span>
            </div>
            <Progress value={goalCompletionRate} className="h-3" />
          </div>

          {aiSummary && (
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Goals Summary</h3>
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                {aiSummary.main_theme}
              </p>
              <ul className="space-y-2 mb-4">
                {aiSummary.key_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                    {point}
                  </li>
                ))}
              </ul>
              <p className="text-sm italic text-purple-700 dark:text-purple-300">
                💫 {aiSummary.motivation}
              </p>
            </div>
          )}

          {isGeneratingSummary && (
            <Alert className="border-purple-500 bg-purple-50 dark:bg-purple-900/20">
              <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
              <AlertDescription>Generating AI summary of your goals...</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Active Goals</h3>
            <Button
              size="sm"
              onClick={() => setShowNewGoalForm(true)}
              className="rounded-xl"
              disabled={showNewGoalForm}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Goal
            </Button>
          </div>

          {showNewGoalForm && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
              <Input
                placeholder="Goal title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded-lg"
              />
              <Textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-lg"
              />
              <div className="grid grid-cols-3 gap-2">
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={cancelEdit} className="rounded-lg">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={() => saveGoal(null)} className="rounded-lg" disabled={!formData.title}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          )}

          {activeGoals.length > 0 && (
            <div className="space-y-3">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                  {editingGoal === goal.id ? (
                    <div className="space-y-3">
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="rounded-lg"
                      />
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="rounded-lg"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={formData.due_date}
                          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="rounded-lg">
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => saveGoal(goal.id)} className="rounded-lg">
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleComplete(goal)}
                            className="flex-shrink-0"
                          >
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </Button>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{goal.title}</h4>
                            {goal.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(goal)}
                            className="text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteGoal(goal.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">{goal.type}</Badge>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-xs capitalize">
                          {goal.category}
                        </Badge>
                        {goal.due_date && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(goal.due_date), 'MMM d')}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Recently Completed</h3>
              <div className="space-y-3">
                {completedGoals.slice(0, 3).map((goal) => (
                  <div 
                    key={goal.id} 
                    className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-gray-900 dark:text-white line-through">{goal.title}</h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Completed on {format(new Date(goal.completed_date), 'MMMM d, yyyy')}
                    </p>
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
