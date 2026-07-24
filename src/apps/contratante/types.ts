export type TabType = 'home' | 'bookings' | 'favorites' | 'profile';

export interface Review {
  clientName: string;
  rating: number;
  text: string;
  eventInfo: string;
  clientImage: string;
}

export interface Professional {
  id: string;
  name: string;
  category: 'Garçom' | 'Segurança' | 'DJ' | 'Limpeza' | 'Som e Iluminação';
  role: string;
  rating: number;
  status: 'EM SERVIÇO' | 'EM TRÂNSITO' | 'STANDBY' | 'FORA DE SERVIÇO';
  image: string;
  successRate: number;
  eventsCount: number;
  skills: string[];
  reviews: Review[];
  verified: boolean;
  transport: string;
}

export interface BookingTeam {
  id: string;
  name: string;
  status: 'EM SERVIÇO' | 'EM TRÂNSITO' | 'STANDBY' | 'SETUP';
  countConfirmed: number;
  countReserve: number;
  rating: number;
  distance?: string;
  eta?: string;
  setupPercentage?: number;
  members: string[]; // name or avatars
}

export interface ClientEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  image: string;
  proCount: number;
  status: 'CONCLUÍDO' | 'ATIVO' | 'AGENDADO';
}

export interface ServiceRequest {
  id: string;
  category: string;
  location: string;
  status: 'PENDENTE' | 'CHAMANDO' | 'CONFIRMADO';
  timestamp: string;
}
