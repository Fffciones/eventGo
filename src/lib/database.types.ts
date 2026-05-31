export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserType = 'CLIENT' | 'PROFESSIONAL';
export type ProfessionalCategory =
  | 'GARCOM' | 'DJ' | 'SEGURANCA' | 'FAXINEIRO'
  | 'FOTOGRAFO' | 'MESTRE_CERIMONIAS' | 'PRODUTOR' | 'CONTROLADOR_ACESSO';
export type ProfessionalStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EMERGENCY';
export type BookingProfessionalStatus =
  | 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'IN_TRANSIT'
  | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHOW';
export type TransactionType =
  | 'BOOKING' | 'COMMISSION' | 'REFUND' | 'CREDIT_PURCHASE' | 'SIGNUP_BONUS' | 'EMERGENCY_FEE';
export type PixStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type NotificationChannel = 'PUSH' | 'WHATSAPP';
export type PriceMultiplierType = 'NORMAL' | 'EMERGENCY' | 'AFTER_HOURS';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          full_name: string;
          avatar_url: string | null;
          user_type: UserType;
          whatsapp_opt_in: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          document: string;
          is_company: boolean;
          credit_balance: number;
          credit_limit: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      professionals: {
        Row: {
          id: string;
          user_id: string;
          mei_number: string;
          category: ProfessionalCategory;
          status: ProfessionalStatus;
          stars: number;
          events_count: number;
          hourly_cache: number;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['professionals']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['professionals']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          location_name: string;
          location: string;
          starts_at: string;
          ends_at: string;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          event_id: string;
          category: ProfessionalCategory;
          quantity: number;
          multiplier_type: PriceMultiplierType;
          total_amount: number;
          commission_pct: number;
          status: BookingStatus;
          search_radius_km: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      booking_professionals: {
        Row: {
          id: string;
          booking_id: string;
          professional_id: string;
          amount: number;
          status: BookingProfessionalStatus;
          checkin_at: string | null;
          checkout_at: string | null;
          no_show_flag: boolean;
          gps_active: boolean;
          transit_requested_at: string | null;
          alert_60_sent: boolean;
          early_checkin: boolean;
          early_minutes: number | null;
          punctuality_score: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['booking_professionals']['Row'], 'created_at' | 'punctuality_score'>;
        Update: Partial<Database['public']['Tables']['booking_professionals']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          channel: NotificationChannel;
          is_read: boolean;
          payload: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          criteria_scores: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          booking_id: string | null;
          from_user_id: string | null;
          to_user_id: string | null;
          type: TransactionType;
          amount: number;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      price_table: {
        Row: {
          id: string;
          category: ProfessionalCategory;
          star_level: number;
          price_8h: number;
          price_4h_extra: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['price_table']['Row'], 'price_4h_extra'>;
        Update: Partial<Database['public']['Tables']['price_table']['Insert']>;
      };
      client_favorites: {
        Row: {
          client_id: string;
          professional_id: string;
          created_at: string;
        };
        Insert: Database['public']['Tables']['client_favorites']['Row'];
        Update: Partial<Database['public']['Tables']['client_favorites']['Row']>;
      };
    };
    Functions: {
      check_professional_availability: {
        Args: { p_professional_id: string; p_starts_at: string; p_ends_at: string; p_location: string };
        Returns: boolean;
      };
      calculate_booking_price: {
        Args: { p_category: ProfessionalCategory; p_star_level: number; p_starts_at: string; p_ends_at: string; p_multiplier_type?: PriceMultiplierType };
        Returns: number;
      };
      find_available_professionals: {
        Args: { p_category: ProfessionalCategory; p_starts_at: string; p_ends_at: string; p_location: string; p_radius_km?: number; p_limit?: number };
        Returns: Array<{ professional_id: string; user_id: string; full_name: string; stars: number; events_count: number; hourly_cache: number; distance_m: number; is_favorite: boolean }>;
      };
      process_booking_payment: {
        Args: { p_booking_id: string };
        Returns: void;
      };
      handle_no_show: {
        Args: { p_booking_professional_id: string };
        Returns: string;
      };
      activate_transit: {
        Args: { p_booking_professional_id: string };
        Returns: void;
      };
      request_transit_activation: {
        Args: { p_booking_professional_id: string };
        Returns: void;
      };
      professional_checkin: {
        Args: { p_booking_professional_id: string };
        Returns: void;
      };
      trigger_emergency_replacement: {
        Args: { p_booking_professional_id: string };
        Returns: string;
      };
    };
  };
}
