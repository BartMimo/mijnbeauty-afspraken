
export enum UserRole {
  CONSUMER = 'CONSUMER',
  SALON_OWNER = 'SALON_OWNER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
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
  time: string;
  description: string;
  status?: string; // e.g., 'active', 'claimed', 'expired'
}

export interface DashboardStats {
  totalBookings: number;
  revenue: number;
  newCustomers: number;
}
