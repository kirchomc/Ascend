import React, { useState, useEffect, useCallback } from "react";
import { Challenge } from "@/api/entities";
import { ChallengeParticipant } from "@/api/entities";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, Trophy, AlertCircle, CheckCircle, Clock, X } from "lucide-react";
import { format } from "date-fns";

export default function ChallengesAdmin() {
  const toast = useToast();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    kind: "PERMANENT",
    xpReward: 100,
    durationDays: 7,
    category: "health",
    difficulty: "easy",
    daily_tasks: "",
    isActive: true,
    start_date: "",
    end_date: ""
  });

  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const allChallenges = await Challenge.list('-created_date');
      
      const challengesWithStats = await Promise.all(
        allChallenges.map(async (challenge) => {
          const participants = await ChallengeParticipant.filter({ 
            challenge_id: challenge.id 
          });
          return {
            ...challenge,
            participants_count: participants.length
          };
        })
      );
      
      setChallenges(challengesWithStats);
      
      // Broadcast update for real-time sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('challenges:updated', { 
          detail: { challenges: challengesWithStats } 
        }));
      }
    } catch (error) {
      console.error("Error loading challenges:", error);
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const challengeData = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        kind: formData.kind,
        xpReward: formData.xpReward,
        durationDays: formData.durationDays,
        category: formData.category,
        difficulty: formData.difficulty,
        daily_tasks: formData.daily_tasks.split('\n').filter(t => t.trim()),
        isActive: formData.isActive,
        participants_count: 0
      };

      if (formData.start_date) challengeData.start_date = formData.start_date;
      if (formData.end_date) challengeData.end_date = formData.end_date;

      if (editingChallenge) {
        await Challenge.update(editingChallenge.id, challengeData);
        toast.success("Challenge updated successfully");
      } else {
        await Challenge.create(challengeData);
        toast.success("Challenge created successfully");
      }

      setShowCreateModal(false);
      setEditingChallenge(null);
      resetForm();
      loadChallenges();
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast.error("Failed to save challenge");
    }
  };

  const handleEdit = (challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title || "",
      slug: challenge.slug || "",
      description: challenge.description || "",
      kind: challenge.kind || "PERMANENT",
      xpReward: challenge.xpReward || 100,
      durationDays: challenge.durationDays || 7,
      category: challenge.category || "health",
      difficulty: challenge.difficulty || "easy",
      daily_tasks: Array.isArray(challenge.daily_tasks) ? challenge.daily_tasks.join('\n') : "",
      isActive: challenge.isActive !== false,
      start_date: challenge.start_date ? format(new Date(challenge.start_date), 'yyyy-MM-dd') : "",
      end_date: challenge.end_date ? format(new Date(challenge.end_date), 'yyyy-MM-dd') : ""
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (challengeId) => {
    if (!confirm("Are you sure you want to delete this challenge? This action cannot be undone.")) {
      return;
    }

    try {
      await Challenge.delete(challengeId);
      toast.success("Challenge deleted successfully");
      loadChallenges();
    } catch (error) {
      console.error("Error deleting challenge:", error);
      toast.error("Failed to delete challenge");
    }
  };

  const toggleActive = async (challenge) => {
    try {
      const updateData = {
        title: challenge.title,
        kind: challenge.kind || "PERMANENT",
        isActive: !challenge.isActive
      };
      
      await Challenge.update(challenge.id, updateData);
      toast.success(`Challenge ${!challenge.isActive ? 'activated' : 'deactivated'}`);
      loadChallenges();
    } catch (error) {
      console.error("Error toggling challenge:", error);
      toast.error("Failed to update challenge status");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      kind: "PERMANENT",
      xpReward: 100,
      durationDays: 7,
      category: "health",
      difficulty: "easy",
      daily_tasks: "",
      isActive: true,
      start_date: "",
      end_date: ""
    });
  };

  const categories = ["health", "focus", "mindset", "relationships", "productivity", "sleep", "fitness", "learning", "creativity", "happiness"];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Challenges Management</h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{challenges.length} total challenges</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setShowCreateModal(true); }} 
          className="rounded-xl w-full sm:w-auto"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Challenge
        </Button>
      </div>

      <div className="grid gap-3 md:gap-4">
        {challenges.map((challenge) => (
          <Card key={challenge.id} className={`${!challenge.isActive && 'opacity-60'}`}>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white break-words">
                      {challenge.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={challenge.isActive ? "bg-green-100 text-green-800 border-0 text-xs" : "bg-gray-100 text-gray-800 border-0 text-xs"}>
                        {challenge.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-xs">
                        {challenge.kind}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-xs">
                        {challenge.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 break-words">
                  {challenge.description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Trophy className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{challenge.xpReward || 0} XP</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{challenge.durationDays || 0} days</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Users className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{challenge.participants_count || 0} participants</span>
                  </div>
                </div>

                {/* Actions - Now in a separate row */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(challenge)}
                    className="flex items-center gap-1 text-xs"
                  >
                    {challenge.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Deactivate</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Activate</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(challenge)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Edit className="w-3 h-3" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(challenge.id)}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg md:text-xl">
                {editingChallenge ? "Edit Challenge" : "Create New Challenge"}
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => { setShowCreateModal(false); setEditingChallenge(null); }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., 7-Day Meditation Challenge"
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this challenge about?"
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <Select value={formData.kind} onValueChange={(value) => setFormData({ ...formData, kind: value })}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERMANENT">Permanent</SelectItem>
                    <SelectItem value="COHORT">Cohort</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">XP</label>
                <Input
                  type="number"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
                  min="0"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Days</label>
                <Input
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                  min="1"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Difficulty</label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Daily Tasks (one per line)</label>
              <Textarea
                value={formData.daily_tasks}
                onChange={(e) => setFormData({ ...formData, daily_tasks: e.target.value })}
                placeholder="Task 1&#10;Task 2&#10;Task 3"
                rows={4}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active (visible to users)
              </label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowCreateModal(false); setEditingChallenge(null); }}
                size="sm"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="w-full sm:w-auto">
                {editingChallenge ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}