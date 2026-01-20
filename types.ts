
export enum UserRole {
  CONSUMER = 'CONSUMER',
  SALON_OWNER = 'SALON_OWNER',
  ADMIN = 'ADMIN'
}

export enum ServiceCategory {
  HAIR = 'Kapper',
  NAILS = 'Nagels',
  LASHES = 'Wimpers',
  MASSAGE = 'Massage',
  FACIAL = 'Gezichtsbehandeling',
  WAXING = 'Waxen / Ontharen',
  MAKEUP = 'Make-up',
  BROWS = 'Wenkbrauwen',
  SKINCARE = 'Huidverzorging',
  TANNING = 'Spray Tan',
  WELLNESS = 'Wellness',
  OTHER = 'Overig'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  allowContactEmail?: boolean; // consent: salons may contact user by email
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: ServiceCategory;
}

export interface Location {
  id: number;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
  province: string;
}

export interface OpeningHours {
  [key: string]: {
    start: string;
    end: string;
    closed: boolean;
  };
}

export interface Salon {
  id: string;
  subdomain: string; // Unique identifier for subdomain routing (e.g., 'glow' for glow.mijnbeautyafspraken.nl)
  name: string;
  description: string;
  address: string;
  city: string;
  zipCode: string;
  categories: ServiceCategory[]; // Salon types
  location_id?: number; // Reference to locations table
  image?: string;
  rating?: number;
  reviewCount?: number;
  services: Service[];
  email?: string;
  phone?: string;
  openingHours?: OpeningHours;
  paymentMethods?: {
    cash: boolean;
    online: boolean;
  };
  stripeAccountId?: string;
  stripePublishableKey?: string;
}

export interface Appointment {
  id: string;
  salonId: string;
  salonName: string;
  serviceId: string;
  serviceName: string;
  date: string; // ISO string
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  price: number;
  customerName: string;
  paymentMethod?: 'cash' | 'online';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
}

export interface Deal {
  id: string;
  salonId: string;
  salonName: string;
  salonCity: string;
  serviceName: string;
  originalPrice: number;
  discountPrice: number;
  date: string;
  time: string; // Formatted display time (e.g., "20 jan, 12:00")
  rawTime: string; // Raw time for database operations (e.g., "12:00")
  durationMinutes: number; // Duration of the service in minutes
  description: string;
  status?: string; // e.g., 'active', 'claimed', 'expired'
}

export interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  paymentMethod: 'cash' | 'online';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalBookings: number;
  revenue: number;
  newCustomers: number;
}
