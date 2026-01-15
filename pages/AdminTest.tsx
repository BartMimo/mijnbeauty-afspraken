import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { AdminSalons } from './dashboards/AdminSalons';
import { AdminUsers } from './dashboards/AdminUsers';

export const AdminTest: React.FC = () => {
  return (
    <DashboardLayout role="admin" basePath="/admintest">
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/salons" element={<AdminSalons />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="*" element={<Navigate to="/admintest" replace />} />
      </Routes>
    </DashboardLayout>
  );
};
