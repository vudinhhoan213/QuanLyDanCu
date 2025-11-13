"use client";

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

// Public Pages
import HomePage from "../pages/HomePage";

// Auth Pages
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";

// Dashboard Pages
import LeaderDashboard from "../pages/dashboard/LeaderDashboard";
import CitizenDashboard from "../pages/dashboard/CitizenDashboard";

// Leader Pages (Old - sẽ migrate dần)
import HouseholdManagement from "../pages/leader/HouseholdManagement";
import CitizenManagement from "../pages/leader/CitizenManagement";
import EditRequestReview from "../pages/leader/EditRequestReview";
import RewardProposalReview from "../pages/leader/RewardProposalReview";
import AuditLogs from "../pages/leader/AuditLogs";
import RewardEventList from "../pages/leader/RewardEventList";
import RewardEventAdd from "../pages/leader/RewardEventAdd";
import RewardEventEdit from "../pages/leader/RewardEventEdit";
import RewardEventRegistrations from "../pages/leader/RewardEventRegistrations";
import RewardEventSchedule from "../pages/leader/RewardEventSchedule";
import RewardDistributions from "../pages/leader/RewardDistributions";

// Lazy load StudentAchievements để tránh lỗi khi import
const StudentAchievements = lazy(() => import("../pages/leader/StudentAchievements"));

// Citizen Pages (Old - sẽ migrate dần)
import MyHousehold from "../pages/citizen/MyHousehold";
import SubmitEditRequest from "../pages/citizen/SubmitEditRequest";
import SubmitRewardProposal from "../pages/citizen/SubmitRewardProposal";
import MyRequests from "../pages/citizen/MyRequests";
import MyRewards from "../pages/citizen/MyRewards";
import EventList from "../pages/citizen/EventList";
import MyRegistrations from "../pages/citizen/MyRegistrations";
import SpecialEvents from "../pages/citizen/SpecialEvents";

// Error Pages
import NotFoundPage from "../pages/errors/NotFoundPage";
import UnauthorizedPage from "../pages/errors/UnauthorizedPage";

const AppRouter = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Leader Routes */}
        <Route
          path="/leader/dashboard"
          element={
            <ProtectedRoute requiredRole="leader">
              <LeaderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/households"
          element={
            <ProtectedRoute requiredRole="leader">
              <HouseholdManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/citizens"
          element={
            <ProtectedRoute requiredRole="leader">
              <CitizenManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/edit-requests"
          element={
            <ProtectedRoute requiredRole="leader">
              <EditRequestReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/reward-proposals"
          element={
            <ProtectedRoute requiredRole="leader">
              <RewardProposalReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/audit-logs"
          element={
            <ProtectedRoute requiredRole="leader">
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/reward-events"
          element={
            <ProtectedRoute requiredRole="leader">
              <RewardEventList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/reward-events/add"
          element={
            <ProtectedRoute requiredRole="leader">
              <RewardEventAdd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/reward-events/:id/edit"
          element={
            <ProtectedRoute requiredRole="leader">
              <RewardEventEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/reward-events/:id/registrations"
          element={
            <ProtectedRoute requiredRole="leader">
              <RewardEventRegistrations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/reward-events/schedule"
          element={
            <ProtectedRoute requiredRole="leader">
              <RewardEventSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/reward-distributions"
          element={
            <ProtectedRoute requiredRole="leader">
              <RewardDistributions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leader/student-achievements"
          element={
            <ProtectedRoute requiredRole="leader">
              <Suspense fallback={<div style={{ padding: "50px", textAlign: "center" }}>Đang tải...</div>}>
                <StudentAchievements />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Citizen Routes */}
        <Route
          path="/citizen/dashboard"
          element={
            <ProtectedRoute requiredRole="citizen">
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/household"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MyHousehold />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/submit-edit-request"
          element={
            <ProtectedRoute requiredRole="citizen">
              <SubmitEditRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/submit-reward-proposal"
          element={
            <ProtectedRoute requiredRole="citizen">
              <SubmitRewardProposal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/my-requests"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MyRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/my-rewards"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MyRewards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/events"
          element={
            <ProtectedRoute requiredRole="citizen">
              <EventList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/events/special"
          element={
            <ProtectedRoute requiredRole="citizen">
              <SpecialEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/my-registrations"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MyRegistrations />
            </ProtectedRoute>
          }
        />

        {/* Root redirect based on user role */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate
                to={
                  user.role === "TO_TRUONG"
                    ? "/leader/dashboard"
                    : "/citizen/dashboard"
                }
                replace
              />
            ) : (
              <HomePage />
            )
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
