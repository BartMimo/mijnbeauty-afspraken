import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Detect custom domain for correct base path
function getBase() {
  // On GitHub Actions, process.env.GITHUB_PAGES is set
  if (process.env.GITHUB_PAGES === 'true') return '/mijnbeauty-afspraken/';
  // On Vercel or custom domain, use root
  if (process.env.CUSTOM_DOMAIN === 'true') return '/';
  // Fallback: check production env
  if (process.env.NODE_ENV === 'production') {
    // If running on GitHub Pages
    if (process.env.URL && process.env.URL.includes('github.io')) return '/mijnbeauty-afspraken/';
    // If running on custom domain
    return '/';
  }
  return '/';
}

export default defineConfig({
  plugins: [react()],
  base: getBase(),
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