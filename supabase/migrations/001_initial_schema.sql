-- EventPro - Initial Schema
-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Enums
create type user_type as enum ('CLIENT', 'PROFESSIONAL');
create type professional_category as enum (
  'GARCOM', 'DJ', 'SEGURANCA', 'FAXINEIRO', 'FOTOGRAFO',
  'MESTRE_CERIMONIAS', 'PRODUTOR', 'CONTROLADOR_ACESSO'
);
create type professional_status as enum ('PENDING', 'ACTIVE', 'BLOCKED');
create type booking_status as enum ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EMERGENCY');
create type booking_professional_status as enum ('INVITED', 'ACCEPTED', 'DECLINED', 'IN_TRANSIT', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW');
create type transaction_type as enum ('BOOKING', 'COMMISSION', 'REFUND', 'CREDIT_PURCHASE', 'SIGNUP_BONUS', 'EMERGENCY_FEE');
create type pix_status as enum ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
create type notification_channel as enum ('PUSH', 'WHATSAPP');
create type price_multiplier_type as enum ('NORMAL', 'EMERGENCY', 'AFTER_HOURS');

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
create table users (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,
  phone         text unique,
  full_name     text not null,
  avatar_url    text,
  user_type     user_type not null,
  whatsapp_opt_in boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------------------------------------------------------------------
-- CLIENTS
-- ---------------------------------------------------------------------
create table clients (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid unique not null references users(id) on delete cascade,
  document        text unique not null,  -- CPF or CNPJ
  is_company      boolean default false,
  credit_balance  numeric(12,2) default 0,
  credit_limit    numeric(12,2) default 0,
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------------
-- PROFESSIONALS
-- ---------------------------------------------------------------------
create table professionals (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid unique not null references users(id) on delete cascade,
  mei_number      text unique not null,
  category        professional_category not null,
  status          professional_status default 'PENDING',
  stars           int default 0,
  events_count    int default 0,
  hourly_cache    numeric(10,2) not null default 0,
  bio             text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ---------------------------------------------------------------------
-- PRICE TABLE
-- ---------------------------------------------------------------------
create table price_table (
  id              uuid primary key default uuid_generate_v4(),
  category        professional_category not null,
  star_level      int not null default 0,  -- 0 = base, 1..5 = stars
  price_8h        numeric(10,2) not null,
  price_4h_extra  numeric(10,2) generated always as (price_8h * 0.5) stored,
  updated_at      timestamptz default now(),
  unique(category, star_level)
);

create table price_multipliers (
  id              uuid primary key default uuid_generate_v4(),
  type            price_multiplier_type not null unique,
  multiplier      numeric(5,2) not null  -- ex: 1.00, 1.50
);

insert into price_multipliers (type, multiplier) values
  ('NORMAL', 1.00),
  ('EMERGENCY', 1.50),
  ('AFTER_HOURS', 1.25);

-- ---------------------------------------------------------------------
-- STAR MILESTONES
-- ---------------------------------------------------------------------
create table star_milestones (
  id              uuid primary key default uuid_generate_v4(),
  star_level      int not null unique,
  min_events      int not null,
  cache_bonus_pct numeric(5,2) not null  -- percentual de aumento sobre o base
);

insert into star_milestones (star_level, min_events, cache_bonus_pct) values
  (1, 10,  10.00),
  (2, 25,  20.00),
  (3, 50,  35.00),
  (4, 100, 50.00),
  (5, 200, 75.00);

-- ---------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------
create table events (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id),
  name            text not null,
  location_name   text not null,
  location        geography(Point, 4326) not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  status          text default 'SCHEDULED',  -- SCHEDULED, ACTIVE, COMPLETED, CANCELLED
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------------------
create table bookings (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references events(id),
  category        professional_category not null,
  quantity        int not null default 1,
  multiplier_type price_multiplier_type default 'NORMAL',
  total_amount    numeric(12,2) not null,
  commission_pct  numeric(5,2) not null default 15.00,
  status          booking_status default 'PENDING',
  search_radius_km int default 5,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table booking_professionals (
  id              uuid primary key default uuid_generate_v4(),
  booking_id      uuid not null references bookings(id),
  professional_id uuid not null references professionals(id),
  amount          numeric(10,2) not null,  -- valor individual
  status          booking_professional_status default 'INVITED',
  checkin_at      timestamptz,
  checkout_at     timestamptz,
  no_show_flag    boolean default false,
  created_at      timestamptz default now(),
  unique(booking_id, professional_id)
);

-- ---------------------------------------------------------------------
-- AVAILABILITY
-- ---------------------------------------------------------------------
create table professional_availability (
  id              uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  is_available    boolean default true
);

-- ---------------------------------------------------------------------
-- GPS TRACKING
-- ---------------------------------------------------------------------
create table professional_locations (
  id              uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  booking_id      uuid references bookings(id),
  location        geography(Point, 4326) not null,
  recorded_at     timestamptz default now()
);

-- index for fast nearest-professional queries
create index idx_prof_locations_geo on professional_locations using gist(location);
create index idx_prof_locations_time on professional_locations(professional_id, recorded_at desc);

-- ---------------------------------------------------------------------
-- FINANCIAL
-- ---------------------------------------------------------------------
create table transactions (
  id              uuid primary key default uuid_generate_v4(),
  booking_id      uuid references bookings(id),
  from_user_id    uuid references users(id),
  to_user_id      uuid references users(id),
  type            transaction_type not null,
  amount          numeric(12,2) not null,
  description     text,
  created_at      timestamptz default now()
);

create table pix_payments (
  id              uuid primary key default uuid_generate_v4(),
  transaction_id  uuid not null references transactions(id),
  pix_key         text not null,
  amount          numeric(12,2) not null,
  status          pix_status default 'PENDING',
  external_id     text,  -- ID do provedor Pix
  paid_at         timestamptz,
  created_at      timestamptz default now()
);

create table credit_packages (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  amount          numeric(12,2) not null,
  bonus_pct       numeric(5,2) default 0,  -- bônus em % sobre o valor comprado
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------
create table reviews (
  id              uuid primary key default uuid_generate_v4(),
  booking_id      uuid not null references bookings(id),
  reviewer_id     uuid not null references users(id),
  reviewee_id     uuid not null references users(id),
  rating          numeric(2,1) not null check (rating >= 1 and rating <= 5),
  comment         text,
  created_at      timestamptz default now(),
  unique(booking_id, reviewer_id)
);

-- ---------------------------------------------------------------------
-- SAVED TEAMS
-- ---------------------------------------------------------------------
create table saved_teams (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  name            text not null,
  created_at      timestamptz default now()
);

create table saved_team_members (
  id              uuid primary key default uuid_generate_v4(),
  saved_team_id   uuid not null references saved_teams(id) on delete cascade,
  professional_id uuid not null references professionals(id),
  unique(saved_team_id, professional_id)
);

-- ---------------------------------------------------------------------
-- FAVORITES
-- ---------------------------------------------------------------------
create table client_favorites (
  client_id       uuid not null references clients(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  created_at      timestamptz default now(),
  primary key(client_id, professional_id)
);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create table notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  title           text not null,
  body            text not null,
  channel         notification_channel default 'PUSH',
  is_read         boolean default false,
  payload         jsonb,  -- dados extras (booking_id, event_id, etc)
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------------
-- INDEXES GERAIS
-- ---------------------------------------------------------------------
create index idx_events_client on events(client_id);
create index idx_events_location on events using gist(location);
create index idx_bookings_event on bookings(event_id);
create index idx_booking_professionals_booking on booking_professionals(booking_id);
create index idx_booking_professionals_pro on booking_professionals(professional_id);
create index idx_transactions_booking on transactions(booking_id);
create index idx_notifications_user on notifications(user_id, is_read);
create index idx_availability_pro on professional_availability(professional_id, starts_at, ends_at);
create index idx_reviews_reviewee on reviews(reviewee_id);
