
import React, { useState, useEffect, useCallback } from "react";
import { Resource } from "@/api/entities";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ExternalLink, CheckCircle, Star, X } from "lucide-react";

export default function ResourcesAdmin() {
  const toast = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [filter, setFilter] = useState({ type: "all", category: "all", status: "all" });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "article",
    category: "health",
    url: "",
    image_url: "",
    duration: "",
    difficulty: "beginner",
    featured: false,
    source: "",
    published_at: ""
  });

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      const allResources = await Resource.list('-created_date');
      setResources(allResources);
    } catch (error) {
      console.error("Error loading resources:", error);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const resourceData = {
        ...formData,
        engagement_score: 0
      };

      if (editingResource) {
        await Resource.update(editingResource.id, resourceData);
        toast.success("Resource updated successfully");
      } else {
        await Resource.create(resourceData);
        toast.success("Resource created successfully");
      }

      setShowCreateModal(false);
      setEditingResource(null);
      resetForm();
      loadResources();
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error("Failed to save resource");
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || "",
      type: resource.type,
      category: resource.category,
      url: resource.url || "",
      image_url: resource.image_url || "",
      duration: resource.duration || "",
      difficulty: resource.difficulty || "beginner",
      featured: resource.featured || false,
      source: resource.source || "",
      published_at: resource.published_at || ""
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (resourceId) => {
    if (!confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    try {
      await Resource.delete(resourceId);
      toast.success("Resource deleted successfully");
      loadResources();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const toggleFeatured = async (resource) => {
    try {
      await Resource.update(resource.id, { featured: !resource.featured });
      toast.success(`Resource ${!resource.featured ? 'featured' : 'unfeatured'}`);
      loadResources();
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Failed to update resource");
    }
  };

  const checkResourceHealth = async (resource) => {
    try {
      // Using a simple fetch, but a more robust check might involve a backend proxy
      // to avoid CORS issues and get proper status codes.
      // For now, it will attempt to hit the URL and catch network errors.
      const response = await fetch(resource.url, { method: 'HEAD', mode: 'no-cors' });
      toast.info("Resource URL appears accessible");
    } catch (error) {
      toast.error("Resource URL may be broken or inaccessible");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "article",
      category: "health",
      url: "",
      image_url: "",
      duration: "",
      difficulty: "beginner",
      featured: false,
      source: "",
      published_at: ""
    });
  };

  const types = ["article", "video", "podcast", "book", "meditation"];
  const categories = ["health", "focus", "mindset", "relationships", "productivity", "sleep", "fitness", "learning", "creativity", "happiness"];

  const filteredResources = resources.filter(r => {
    if (filter.type !== "all" && r.type !== filter.type) return false;
    if (filter.category !== "all" && r.category !== filter.category) return false;
    if (filter.status === "featured" && !r.featured) return false;
    return true;
  });

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
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Resources Management</h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{resources.length} total resources</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateModal(true); }} className="rounded-xl w-full sm:w-auto" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select value={filter.type} onValueChange={(value) => setFilter({ ...filter, type: value })}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map(t => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter.category} onValueChange={(value) => setFilter({ ...filter, category: value })}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="featured">Featured Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:gap-4">
        {filteredResources.map((resource) => (
          <Card key={resource.id}>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white break-words">
                        {resource.title}
                      </h3>
                      {resource.featured && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-0 flex-shrink-0 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline" className="capitalize text-xs dark:border-gray-600 dark:text-gray-300">
                        {resource.type}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-xs dark:border-gray-600 dark:text-gray-300">
                        {resource.category}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 break-words">
                      {resource.description}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                      {resource.source && <span className="break-all">Source: {resource.source}</span>}
                      {resource.duration && <span className="whitespace-nowrap">{resource.duration}</span>}
                      {resource.difficulty && <span className="capitalize whitespace-nowrap">Difficulty: {resource.difficulty}</span>}
                      {resource.url && (
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions Row */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFeatured(resource)}
                    title={resource.featured ? "Unfeature" : "Feature"}
                    className="text-xs dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Star className={`w-3 h-3 mr-1 ${resource.featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    <span className="hidden sm:inline">{resource.featured ? 'Unfeature' : 'Feature'}</span>
                  </Button>
                  {resource.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkResourceHealth(resource)}
                      title="Check URL"
                      className="text-xs dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <CheckCircle className="w-3 h-3 mr-1 text-green-600 dark:text-green-400" />
                      <span className="hidden sm:inline">Check</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(resource)}
                    className="text-xs dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(resource.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
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
                {editingResource ? "Edit Resource" : "Add New Resource"}
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => { setShowCreateModal(false); setEditingResource(null); }}
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
                placeholder="e.g., 10-Minute Morning Meditation"
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the resource"
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
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
                    {categories.map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">URL</label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Image URL (Optional)</label>
              <Input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Duration</label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 10 min read"
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
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Source</label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., Medium"
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Published Date (Optional)</label>
              <Input
                type="date"
                value={formData.published_at}
                onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="featured" className="text-sm font-medium">
                Featured (show prominently)
              </label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowCreateModal(false); setEditingResource(null); }}
                className="w-full sm:w-auto"
                size="sm"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto" size="sm">
                {editingResource ? "Update" : "Create"} Resource
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
