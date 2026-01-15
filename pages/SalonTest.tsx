import React from 'react';
import { DashboardLayout } from '../components/Layout';
import { SalonDashboard } from './dashboards/SalonDashboard';

export const SalonTest: React.FC = () => {
  return (
    <DashboardLayout role="salon">
      <SalonDashboard />
    </DashboardLayout>
  );
};
