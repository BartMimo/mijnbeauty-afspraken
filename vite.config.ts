import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
          supabase: ['@supabase/supabase-js'],
          // Split large components
          dashboards: [
            './pages/dashboards/SalonDashboard.tsx',
            './pages/dashboards/SalonSettings.tsx',
            './pages/dashboards/SalonSchedule.tsx',
            './pages/dashboards/SalonServices.tsx',
            './pages/dashboards/SalonDeals.tsx',
            './pages/dashboards/SalonStaff.tsx',
            './pages/dashboards/SalonClients.tsx',
            './pages/dashboards/UserDashboard.tsx',
            './pages/dashboards/UserFavorites.tsx',
            './pages/dashboards/UserProfile.tsx',
            './pages/dashboards/AdminDashboard.tsx',
            './pages/dashboards/AdminUsers.tsx',
            './pages/dashboards/AdminSalons.tsx',
            './pages/dashboards/StaffDashboard.tsx',
            './pages/dashboards/StaffProfile.tsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});