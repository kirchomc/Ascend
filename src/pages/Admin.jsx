import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Trophy, BookOpen, Users, BarChart3, Globe, Menu } from "lucide-react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import ChallengesAdmin from "../components/admin/ChallengesAdmin";
import ResourcesAdmin from "../components/admin/ResourcesAdmin";
import UsersAdmin from "../components/admin/UsersAdmin";
import AnalyticsAdmin from "../components/admin/AnalyticsAdmin";
import LocalizationAdmin from "../components/admin/LocalizationAdmin";

const tabs = [
  { value: "challenges", label: "Challenges", icon: Trophy, mobileLabel: "Challenges" },
  { value: "resources", label: "Resources", icon: BookOpen, mobileLabel: "Resources" },
  { value: "users", label: "Users", icon: Users, mobileLabel: "Users" },
  { value: "analytics", label: "Analytics", icon: BarChart3, mobileLabel: "Analytics" },
  { value: "localization", label: "i18n", icon: Globe, mobileLabel: "i18n" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("challenges");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const checkAdminAccess = useCallback(async () => {
    try {
      const currentUser = await User.me();
      
      if (currentUser.role !== 'admin') {
        toast.error("Unauthorized: Admin access required");
        navigate(createPageUrl("Dashboard"));
        return;
      }

      setUser(currentUser);
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast.error("Failed to verify admin access");
      navigate(createPageUrl("Dashboard"));
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-red-600 flex-shrink-0" />
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage challenges, resources, users, and system settings
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <Card className="shadow-xl">
          <CardContent className="p-3 md:p-6">
            {/* Desktop Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="hidden md:block">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* Mobile Tab Selector */}
              <div className="md:hidden mb-4">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        {tabs.find(t => t.value === activeTab)?.icon && 
                          React.createElement(tabs.find(t => t.value === activeTab).icon, { className: "w-4 h-4" })}
                        {tabs.find(t => t.value === activeTab)?.mobileLabel}
                      </span>
                      <Menu className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto">
                    <div className="py-4">
                      <h3 className="text-lg font-semibold mb-4">Select Section</h3>
                      <div className="space-y-2">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <Button
                              key={tab.value}
                              variant={activeTab === tab.value ? "default" : "outline"}
                              className="w-full justify-start gap-2"
                              onClick={() => {
                                setActiveTab(tab.value);
                                setMobileMenuOpen(false);
                              }}
                            >
                              <Icon className="w-4 h-4" />
                              {tab.mobileLabel}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <TabsContent value="challenges">
                <ChallengesAdmin />
              </TabsContent>

              <TabsContent value="resources">
                <ResourcesAdmin />
              </TabsContent>

              <TabsContent value="users">
                <UsersAdmin />
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsAdmin />
              </TabsContent>

              <TabsContent value="localization">
                <LocalizationAdmin />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}