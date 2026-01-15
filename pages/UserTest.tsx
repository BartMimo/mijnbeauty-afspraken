import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout';
import { UserDashboard } from './dashboards/UserDashboard';
import { UserFavorites } from './dashboards/UserFavorites';
import { UserProfile } from './dashboards/UserProfile';

export const UserTest: React.FC = () => {
  return (
    <DashboardLayout role="user" basePath="/usertest">
      <Routes>
        <Route path="/" element={<UserDashboard />} />
        <Route path="/appointments" element={<UserDashboard />} />
        <Route path="/favorites" element={<UserFavorites />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="*" element={<Navigate to="/usertest" replace />} />
      </Routes>
    </DashboardLayout>
  );
};
