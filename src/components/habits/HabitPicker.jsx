import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { HabitTemplate } from "@/api/entities";
import { Habit } from "@/api/entities";
import { User } from "@/api/entities";
import { CheckCircle, Sparkles } from "lucide-react";

const MAX_SELECTION = 5;

export default function HabitPicker({ onHabitsAdded, existingHabitIds = [] }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadHabitTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      // Load recommended habit templates
      const allTemplates = await HabitTemplate.filter({ is_recommended: true }, '-popularity', 20);
      // Filter out habits user already has
      const available = allTemplates.filter(t => !existingHabitIds.includes(t.id));
      setTemplates(available);
    } catch (error) {
      console.error("Error loading habit templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [existingHabitIds]);

  useEffect(() => {
    loadHabitTemplates();
  }, [loadHabitTemplates]);

  const toggleHabit = (templateId) => {
    setSelected(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else if (prev.length < MAX_SELECTION) {
        return [...prev, templateId];
      }
      return prev;
    });
  };

  const saveSelected = async () => {
    if (selected.length === 0) return;

    try {
      setIsSaving(true);
      const currentUser = await User.me();

      // Create habits from selected templates
      const newHabits = [];
      for (const templateId of selected) {
        const template = templates.find(t => t.id === templateId);
        if (template) {
          const habit = await Habit.create({
            name: template.name,
            category: template.category,
            icon: template.icon,
            current_streak: 0,
            best_streak: 0,
            target_frequency: "daily",
            is_active: true
          });
          newHabits.push(habit);

          // Update template popularity
          await HabitTemplate.update(templateId, {
            popularity: (template.popularity || 0) + 1
          });
        }
      }

      // Broadcast update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user:habits:updated', {
          detail: { habits: newHabits }
        }));
      }

      setSelected([]);
      if (onHabitsAdded) {
        onHabitsAdded(newHabits);
      }
    } catch (error) {
      console.error("Error saving habits:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Recommended Habits
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select up to {MAX_SELECTION} habits to add to your routine
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {templates.map((template) => {
            const isSelected = selected.includes(template.id);
            const isDisabled = !isSelected && selected.length >= MAX_SELECTION;

            return (
              <button
                key={template.id}
                onClick={() => !isDisabled && toggleHabit(template.id)}
                disabled={isDisabled}
                className={`flex items-start gap-3 p-4 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                    : isDisabled
                    ? 'bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isSelected ? (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{template.icon}</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </p>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {template.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {template.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.difficulty}
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {selected.length} habit{selected.length !== 1 ? 's' : ''} selected
            </p>
            <Button
              onClick={saveSelected}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                `Add Selected`
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}