import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, MessageSquare, Users, Clock, Info } from "lucide-react";

export default function ForumsStubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("latest");

  // Mock data for stub
  const mockThreads = [
    { id: 1, title: "How do you stay consistent with check-ins?", author: "JohnDoe", replies: 12, lastActivity: "2 hours ago" },
    { id: 2, title: "Best morning routines for productivity", author: "SarahM", replies: 8, lastActivity: "5 hours ago" },
    { id: 3, title: "Celebrating 30-day streak! 🎉", author: "MikeR", replies: 24, lastActivity: "1 day ago" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Community"))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Community Forums
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Connect with others on their growth journey
            </p>
          </div>
        </div>

        <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Real-time chat coming soon! For now, use the community board below.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between items-center mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="latest">Latest</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="my_posts">My Posts</TabsTrigger>
              </TabsList>
              <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start a Thread
              </Button>
            </div>

            <TabsContent value={activeTab} className="space-y-4">
              {mockThreads.map((thread, index) => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                            {thread.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {thread.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {thread.replies} replies
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {thread.lastActivity}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">Discussion</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <Card className="mt-8 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-600" />
              Coming Soon: Real-Time Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We're working on bringing you:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Live messaging with other members
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Category-specific discussion rooms
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Direct messaging
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Community moderation tools
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}