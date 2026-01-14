
import { Salon, ServiceCategory, Appointment, UserRole, Deal } from '../types';

export const MOCK_SALONS: Salon[] = [
  {
    id: 'glow',
    subdomain: 'glow',
    name: 'Glow & Shine Studio',
    description: 'Specialist in biab nagels en wimperextensions. Een rustige plek voor jezelf.',
    address: 'Kerkstraat 12',
    city: 'Amsterdam',
    zipCode: '1012 AB',
    image: 'https://picsum.photos/800/600?random=1',
    rating: 4.8,
    reviewCount: 124,
    ownerId: 'owner1',
    email: 'info@glowshine.nl',
    phone: '0612345678',
    services: [
      { id: 's1', name: 'Biab Nagels', description: 'Versteviging van de natuurlijke nagel', price: 45, durationMinutes: 60, category: ServiceCategory.NAILS },
      { id: 's2', name: 'Wimperextensions One by One', description: 'Natuurlijke look', price: 65, durationMinutes: 90, category: ServiceCategory.LASHES },
    ]
  },
  {
    id: 'barber',
    subdomain: 'barber',
    name: 'Barber Bros',
    description: 'Klassieke herenkapper. Strakke fades en baardtrimmen.',
    address: 'Stationsweg 45',
    city: 'Utrecht',
    zipCode: '3511 BC',
    image: 'https://picsum.photos/800/600?random=2',
    rating: 4.9,
    reviewCount: 210,
    ownerId: 'owner2',
    email: 'contact@barberbros.nl',
    phone: '0301234567',
    services: [
      { id: 's3', name: 'Heren Knippen', description: 'Wassen, knippen en stylen', price: 35, durationMinutes: 30, category: ServiceCategory.HAIR },
      { id: 's4', name: 'Baard Trimmen', description: 'Contouren en verzorging', price: 20, durationMinutes: 20, category: ServiceCategory.HAIR },
    ]
  },
  {
    id: 'zen',
    subdomain: 'zen',
    name: 'Zen Massage Praktijk',
    description: 'Kom volledig tot rust met onze ontspanningsmassages.',
    address: 'Lindenlaan 8',
    city: 'Rotterdam',
    zipCode: '3012 CD',
    image: 'https://picsum.photos/800/600?random=3',
    rating: 4.7,
    reviewCount: 85,
    ownerId: 'owner3',
    email: 'info@zenmassage.nl',
    phone: '0109876543',
    services: [
      { id: 's5', name: 'Ontspanningsmassage', description: '60 minuten volledige lichaamsmassage', price: 70, durationMinutes: 60, category: ServiceCategory.MASSAGE },
      { id: 's6', name: 'Sportmassage', description: 'Intensieve massage voor spierherstel', price: 75, durationMinutes: 45, category: ServiceCategory.MASSAGE },
    ]
  },
    {
    id: 'bella',
    subdomain: 'bella',
    name: 'Bella Hair',
    description: 'Dé specialist in kleuringen en balayage.',
    address: 'Dorpsstraat 101',
    city: 'Amstelveen',
    zipCode: '1182 AB',
    image: 'https://picsum.photos/800/600?random=4',
    rating: 4.6,
    reviewCount: 150,
    ownerId: 'owner4',
    email: 'afspraken@bellahair.nl',
    phone: '0205554433',
    services: [
      { id: 's7', name: 'Dames Knippen', description: 'Inclusief wassen en drogen', price: 45, durationMinutes: 45, category: ServiceCategory.HAIR },
      { id: 's8', name: 'Balayage', description: 'Vanaf prijs, inclusief toner', price: 120, durationMinutes: 180, category: ServiceCategory.HAIR },
    ]
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    salonId: 'glow',
    salonName: 'Glow & Shine Studio',
    serviceId: 's1',
    serviceName: 'Biab Nagels',
    date: '2023-11-15',
    time: '14:00',
    status: 'confirmed',
    price: 45,
    customerName: 'Sophie de Vries'
  },
  {
    id: 'a2',
    salonId: 'barber',
    salonName: 'Barber Bros',
    serviceId: 's3',
    serviceName: 'Heren Knippen',
    date: '2023-11-20',
    time: '10:30',
    status: 'completed',
    price: 35,
    customerName: 'Sophie de Vries'
  }
];

export const MOCK_REVIEWS = [
    { id: 1, user: "Anouk", text: "Geweldige service, erg blij met het resultaat!", rating: 5 },
    { id: 2, user: "Lisa", text: "Fijne sfeer en professioneel personeel.", rating: 4 },
];

export const MOCK_DEALS: Deal[] = [
  {
    id: 'd1',
    salonId: 'glow',
    salonName: 'Glow & Shine Studio',
    salonCity: 'Amsterdam',
    serviceName: 'Biab Nagels (Last-minute)',
    originalPrice: 45,
    discountPrice: 30,
    date: 'Vandaag',
    time: '15:30',
    description: 'Last-minute plekje vrijgekomen!'
  },
  {
    id: 'd2',
    salonId: 'zen',
    salonName: 'Zen Massage',
    salonCity: 'Rotterdam',
    serviceName: 'Ontspanningsmassage 60min',
    originalPrice: 70,
    discountPrice: 49,
    date: 'Morgen',
    time: '10:00',
    description: 'Ochtend deal'
  },
   {
    id: 'd3',
    salonId: 'bella',
    salonName: 'Bella Hair',
    salonCity: 'Amstelveen',
    serviceName: 'Wassen & Stylen',
    originalPrice: 35,
    discountPrice: 20,
    date: 'Vandaag',
    time: '16:00',
    description: 'Gaatje in de agenda'
  },
  {
    id: 'd4',
    salonId: '2',
    salonName: 'Barber Bros',
    salonCity: 'Utrecht',
    serviceName: 'Baard Trimmen Deluxe',
    originalPrice: 25,
    discountPrice: 15,
    date: 'Vandaag',
    time: '14:15',
    description: 'Flash sale'
  }
];
