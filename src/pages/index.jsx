import Layout from "./Layout.jsx";

import Onboarding from "./Onboarding";

import Dashboard from "./Dashboard";

import CheckIn from "./CheckIn";

import Goals from "./Goals";

import Journal from "./Journal";

import Challenges from "./Challenges";

import Library from "./Library";

import Profile from "./Profile";

import WeeklyChallenges from "./WeeklyChallenges";

import AIGoalHelper from "./AIGoalHelper";

import Achievements from "./Achievements";

import Community from "./Community";

import AllAchievements from "./AllAchievements";

import ForumsStub from "./ForumsStub";

import HabitRecommendations from "./HabitRecommendations";

import Settings from "./Settings";

import AICoach from "./AICoach";

import RewardsShop from "./RewardsShop";

import Admin from "./Admin";

import PremiumPortal from "./PremiumPortal";

import ProSupport from "./ProSupport";

import ProAnalytics from "./ProAnalytics";

import ProInsights from "./ProInsights";

import BetaFeatures from "./BetaFeatures";

import ThemeCustomizer from "./ThemeCustomizer";

import Welcome from "./Welcome";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Onboarding: Onboarding,
    
    Dashboard: Dashboard,
    
    CheckIn: CheckIn,
    
    Goals: Goals,
    
    Journal: Journal,
    
    Challenges: Challenges,
    
    Library: Library,
    
    Profile: Profile,
    
    WeeklyChallenges: WeeklyChallenges,
    
    AIGoalHelper: AIGoalHelper,
    
    Achievements: Achievements,
    
    Community: Community,
    
    AllAchievements: AllAchievements,
    
    ForumsStub: ForumsStub,
    
    HabitRecommendations: HabitRecommendations,
    
    Settings: Settings,
    
    AICoach: AICoach,
    
    RewardsShop: RewardsShop,
    
    Admin: Admin,
    
    PremiumPortal: PremiumPortal,
    
    ProSupport: ProSupport,
    
    ProAnalytics: ProAnalytics,
    
    ProInsights: ProInsights,
    
    BetaFeatures: BetaFeatures,
    
    ThemeCustomizer: ThemeCustomizer,
    
    Welcome: Welcome,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Onboarding />} />
                
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/CheckIn" element={<CheckIn />} />
                
                <Route path="/Goals" element={<Goals />} />
                
                <Route path="/Journal" element={<Journal />} />
                
                <Route path="/Challenges" element={<Challenges />} />
                
                <Route path="/Library" element={<Library />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/WeeklyChallenges" element={<WeeklyChallenges />} />
                
                <Route path="/AIGoalHelper" element={<AIGoalHelper />} />
                
                <Route path="/Achievements" element={<Achievements />} />
                
                <Route path="/Community" element={<Community />} />
                
                <Route path="/AllAchievements" element={<AllAchievements />} />
                
                <Route path="/ForumsStub" element={<ForumsStub />} />
                
                <Route path="/HabitRecommendations" element={<HabitRecommendations />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/AICoach" element={<AICoach />} />
                
                <Route path="/RewardsShop" element={<RewardsShop />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/PremiumPortal" element={<PremiumPortal />} />
                
                <Route path="/ProSupport" element={<ProSupport />} />
                
                <Route path="/ProAnalytics" element={<ProAnalytics />} />
                
                <Route path="/ProInsights" element={<ProInsights />} />
                
                <Route path="/BetaFeatures" element={<BetaFeatures />} />
                
                <Route path="/ThemeCustomizer" element={<ThemeCustomizer />} />
                
                <Route path="/Welcome" element={<Welcome />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}