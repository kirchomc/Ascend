import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Resource } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Library as LibraryIcon,
  ExternalLink,
  Search,
  Filter,
  Star,
  PlayCircle,
  FileText,
  Headphones,
  BookOpen,
  Brain,
  RefreshCw,
  Crown,
  AlertCircle
} from "lucide-react";

const typeIcons = {
  article: FileText,
  video: PlayCircle,
  podcast: Headphones,
  book: BookOpen,
  meditation: Brain
};

const typeColors = {
  article: "bg-blue-100 text-blue-800",
  video: "bg-red-100 text-red-800",
  podcast: "bg-purple-100 text-purple-800",
  book: "bg-green-100 text-green-800",
  meditation: "bg-indigo-100 text-indigo-800"
};

export default function LibraryPage() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      const allResources = await Resource.list('-published_at');
      setResources(allResources);
    } catch (error) {
      console.error("Error loading resources:", error);
      setError("Failed to load resources. Please try again.");
    }
  };

  const handleRefresh = async () => {
    const isLitePlan = user?.plan === "lite" || !user?.plan;
    
    if (isLitePlan && viewCount >= 6) {
      setError("Lite plan: 6 fresh picks per day. Upgrade to Pro for unlimited!");
      return;
    }

    setIsRefreshing(true);
    setError(null);
    
    try {
      await loadResources();
      setViewCount(viewCount + 1);
    } catch (error) {
      setError("Could not refresh resources");
    }
    
    setIsRefreshing(false);
  };

  // Smart filtering: prioritize user's focus areas when "all" category selected
  const getFilteredAndSortedResources = () => {
    let filtered = resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
      const matchesType = selectedType === "all" || resource.type === selectedType;
      
      return matchesSearch && matchesCategory && matchesType;
    });

    // Smart sorting when "all" category is selected
    if (selectedCategory === "all" && userProfile?.focus_areas?.length > 0) {
      const userFocusAreas = userProfile.focus_areas;
      
      // Separate resources into priority groups
      const priorityResources = filtered.filter(r => userFocusAreas.includes(r.category));
      const otherResources = filtered.filter(r => !userFocusAreas.includes(r.category));
      
      // Return priority resources first, then others
      return [...priorityResources, ...otherResources];
    }

    return filtered;
  };

  const filteredResources = getFilteredAndSortedResources();
  const isLitePlan = user?.plan === "lite" || !user?.plan;
  const displayedResources = isLitePlan ? filteredResources.slice(0, 10) : filteredResources;

  // Show smart filtering indicator
  const showingSmartFilter = selectedCategory === "all" && userProfile?.focus_areas?.length > 0;

  const categories = ["all", "health", "fitness", "mindset", "productivity", "focus", "relationships", "learning", "creativity", "happiness", "sleep"];
  const types = ["all", "article", "video", "podcast", "book", "meditation"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Fresh Picks for You
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Curated content to support your growth
              {isLitePlan && ` (${viewCount}/6 refreshes today)`}
            </p>
            {showingSmartFilter && (
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                <Star className="w-4 h-4" />
                Showing your focus areas first
              </p>
            )}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing || (isLitePlan && viewCount >= 6)}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 rounded-xl"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLitePlan && viewCount >= 6 && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <Crown className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Unlock unlimited resources with Pro!
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Filter className="w-5 h-5 text-gray-400 mt-2" />
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-xl capitalize"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="rounded-xl capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {displayedResources.map((resource, index) => {
              const TypeIcon = typeIcons[resource.type] || FileText;
              const isPriority = showingSmartFilter && userProfile?.focus_areas?.includes(resource.category);
              
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`shadow-lg hover:shadow-xl transition-all h-full flex flex-col ${isPriority ? 'ring-2 ring-purple-400' : ''}`}>
                    {resource.image_url && (
                      <div className="h-48 overflow-hidden rounded-t-xl relative">
                        <img
                          src={resource.image_url}
                          alt={resource.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        {isPriority && (
                          <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            For You
                          </div>
                        )}
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`${typeColors[resource.type]} border-0 rounded-lg flex items-center gap-1`}>
                          <TypeIcon className="w-3 h-3" />
                          {resource.type}
                        </Badge>
                        {resource.featured && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-0 rounded-lg">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {resource.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline" className="rounded-lg capitalize text-xs">
                            {resource.category}
                          </Badge>
                          {resource.duration && (
                            <Badge variant="outline" className="rounded-lg text-xs">
                              {resource.duration}
                            </Badge>
                          )}
                          {resource.difficulty && (
                            <Badge variant="outline" className="rounded-lg capitalize text-xs">
                              {resource.difficulty}
                            </Badge>
                          )}
                          {resource.source && (
                            <Badge variant="outline" className="rounded-lg text-xs">
                              {resource.source}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 rounded-xl"
                      >
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          View Resource
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {displayedResources.length === 0 && (
            <div className="col-span-full">
              <Card className="shadow-lg">
                <CardContent className="p-12 text-center">
                  <LibraryIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    No resources found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your filters or check back soon for new content
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}