
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { JournalEntry } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  X,
  Sparkles,
  Search,
  AlertCircle, // Added for error messages
  Crown // Added for Pro features
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Added for error and info messages

const prompts = [
  "What are three things you're grateful for today?",
  "What went well today and why?",
  "What challenge did you overcome recently?",
  "What's something you learned about yourself this week?",
  "What are you looking forward to?",
  "How did you show kindness today?",
  "What made you smile today?",
  "What's one thing you want to improve tomorrow?",
  "Describe a moment when you felt proud of yourself.",
  "What's on your mind right now?"
];

const moods = [
  { value: "very_sad", emoji: "😢", label: "Very Sad" },
  { value: "sad", emoji: "😕", label: "Sad" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "very_happy", emoji: "🤩", label: "Very Happy" }
];

export default function JournalPage() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("neutral");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null); // New state for error messages

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (showForm) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setCurrentPrompt(randomPrompt);
      setError(null); // Clear error when form is opened
    }
  }, [showForm]);

  const loadEntries = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const userEntries = await JournalEntry.filter({ created_by: currentUser.email }, '-date');
      setEntries(userEntries);
    } catch (error) {
      console.error("Error loading journal entries:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    try {
      const isLitePlan = user?.plan === "lite" || !user?.plan; // Consider no plan as lite
      
      // Lite plan entry limit - 10 per month
      if (isLitePlan) {
        const currentDate = new Date();
        // Set to the first day of the current month, 00:00:00.000 (local time)
        const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        // Count entries from this month
        const thisMonthEntries = entries.filter(entry => {
          // Parse entry.date (YYYY-MM-DD string) into a local Date object at midnight
          const [year, month, day] = entry.date.split('-').map(Number);
          const entryDate = new Date(year, month - 1, day); // month is 0-indexed for Date constructor
          return entryDate >= firstOfMonth;
        });
        
        if (thisMonthEntries.length >= 10) {
          setError("You've reached your monthly limit of 10 journal entries on Lite. Entries reset on the 1st of each month. Upgrade to Pro for unlimited entries!");
          return;
        }
      }

      // Content validation
      if (!content || content.trim().length === 0) {
        setError("Please write something in your journal.");
        return;
      }

      if (content.length > 5000) {
        setError("Journal entry must be 5000 characters or less.");
        return;
      }

      await JournalEntry.create({
        created_by: user.email,
        date: format(new Date(), 'yyyy-MM-dd'), // Store date as YYYY-MM-DD string
        prompt: currentPrompt,
        content: content,
        mood: selectedMood,
        tags: []
      });

      setContent("");
      setSelectedMood("neutral");
      setShowForm(false);
      loadEntries();
    } catch (err) {
      console.error("Error saving journal entry:", err);
      setError("We could not save your journal. Please try again.");
    }
  };

  const deleteEntry = async (entryId) => {
    try {
      await JournalEntry.delete(entryId);
      loadEntries();
    } catch (err) {
      console.error("Error deleting journal entry:", err);
      setError("Failed to delete entry. Please try again.");
    }
  };

  const isLitePlan = user?.plan === "lite" || !user?.plan;
  
  // Calculate current month entries for Lite users
  let currentMonthEntries = 0;
  if (isLitePlan && entries.length > 0) {
    const currentDate = new Date();
    const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    currentMonthEntries = entries.filter(entry => {
      // Parse entry.date (YYYY-MM-DD string) into a local Date object at midnight
      const [year, month, day] = entry.date.split('-').map(Number);
      const entryDate = new Date(year, month - 1, day); // month is 0-indexed for Date constructor
      return entryDate >= firstOfMonth;
    }).length;
  }
  
  const canCreateEntry = !isLitePlan || currentMonthEntries < 10;
  const canSearch = !isLitePlan;

  const filteredEntries = canSearch 
    ? entries.filter(entry =>
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              My Journal
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Reflect on your journey and track your thoughts
              {isLitePlan && ` (${currentMonthEntries}/10 this month)`}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => canCreateEntry ? setShowForm(true) : setError("Upgrade to Pro to write more entries!")}
            disabled={!canCreateEntry}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Entry
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="dark:text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {!canCreateEntry && isLitePlan && ( // Display this only if user is Lite and hit limit
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
            <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              You've reached your monthly limit of 10 entries. Entries reset on the 1st of each month. Upgrade to Pro for unlimited journaling!
            </AlertDescription>
          </Alert>
        )}

        {entries.length > 0 && !showForm && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder={canSearch ? "Search your journal..." : "Search available in Pro plan"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!canSearch}
                className="pl-10 rounded-xl dark:bg-gray-800 dark:text-gray-50 dark:border-gray-700 placeholder:dark:text-gray-400"
              />
              {!canSearch && (
                <Crown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500 dark:text-yellow-400 w-5 h-5" />
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      New Journal Entry
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="dark:text-gray-400 dark:hover:bg-gray-700">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
                        Today's Prompt:
                      </p>
                      <p className="text-gray-900 dark:text-white italic">
                        "{currentPrompt}"
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block dark:text-gray-200">
                        Your Thoughts <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        placeholder="Write your thoughts..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        maxLength={5000}
                        className="rounded-xl min-h-48 dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600 placeholder:dark:text-gray-400"
                      />
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                        {content.length}/5000 characters
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block dark:text-gray-200">How are you feeling?</label>
                      <div className="flex gap-3">
                        {moods.map((mood) => (
                          <button
                            key={mood.value}
                            type="button"
                            onClick={() => setSelectedMood(mood.value)}
                            className={`p-3 rounded-xl transition-all ${
                              selectedMood === mood.value
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-110'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-50'
                            }`}
                          >
                            <span className="text-2xl">{mood.emoji}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl dark:border-gray-700 dark:text-gray-50 dark:hover:bg-gray-700">
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl">
                        Save Entry
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
            {filteredEntries.map((entry, index) => {
              const moodData = moods.find(m => m.value === entry.mood);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{moodData?.emoji || "📝"}</div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {format(new Date(entry.date), 'MMMM d, yyyy')}
                              </span>
                            </div>
                            {entry.prompt && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 italic">
                                Prompt: "{entry.prompt}"
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-500 hover:text-red-700 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                        {entry.content}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredEntries.length === 0 && (
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {searchQuery ? "No entries found" : "Start your journaling journey"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery 
                    ? "Try a different search term" 
                    : "Write your first entry to begin tracking your thoughts and feelings"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => canCreateEntry ? setShowForm(true) : setError("Upgrade to Pro to write more entries!")}
                    disabled={!canCreateEntry}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Write First Entry
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
