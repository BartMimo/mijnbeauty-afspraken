import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout';
import { SalonDashboard } from './dashboards/SalonDashboard';
import { SalonSchedule } from './dashboards/SalonSchedule';
import { SalonServices } from './dashboards/SalonServices';
import { SalonStaff } from './dashboards/SalonStaff';
import { SalonSettings } from './dashboards/SalonSettings';
import { SalonDeals } from './dashboards/SalonDeals';
import { SalonClients } from './dashboards/SalonClients';

export const SalonTest: React.FC = () => {
  return (
    <DashboardLayout role="salon" basePath="/salontest">
      <Routes>
        <Route path="/" element={<SalonDashboard />} />
        <Route path="/schedule" element={<SalonSchedule />} />
        <Route path="/services" element={<SalonServices />} />
        <Route path="/staff" element={<SalonStaff />} />
        <Route path="/settings" element={<SalonSettings />} />
        <Route path="/deals" element={<SalonDeals />} />
        <Route path="/clients" element={<SalonClients />} />
        <Route path="*" element={<Navigate to="/salontest" replace />} />
      </Routes>
    </DashboardLayout>
  );
};
