/**
 * Configuração da landing pública (/site).
 * Destinos de CTA apontam para os fluxos reais do app do Contratante (/),
 * que lê o parâmetro ?auth= e abre o modo correspondente do AuthScreen.
 */

// Deep-links para o AuthScreen (app raiz)
export const AUTH_LINKS = {
  login: '/?auth=login',
  signupClient: '/?auth=signup-client',       // "Quero contratar um profissional"
  signupProfessional: '/?auth=signup-professional', // "Quero oferecer meus serviços"
};

// TODO: preencher com os links reais das lojas quando os apps forem publicados.
export const APP_STORE_URL = '';
export const GOOGLE_PLAY_URL = '';

// Imagens hospedadas (geradas junto ao design no Stitch).
export const IMAGES = {
  bartenderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG56Xh-lunYn_icvAajlszfoAWBbd_MdnCZHhlri9QfppUITTErjkommCc-lhLsA_dezVy0eQ__cLWJUaucptmXqB3yeZfSG4xoad9XpJ-NgIuWffbw1im7yG0oscAGtu7g8X1zdLxTzSu_T7FkXPNQKrlrHT9fqnv99Po0JXS7FtmzJgL0FFvyayzX6gp8OJBoWtjxF31LAykInzHANVYNlu9ni6vQzszMkDCdsirRiHqADDmMMJpog',
  photographerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvGLZsGzdg5wLo7QNROtKRxhiTTooKNHBlcLqDkSYwpZfE5UK23zIFO8Bs_gHa_MTfgQrkjKIHrenbMuKSlhbBRIe78tunr7kW8prXsWc8ywji1jyd5BmmSPS3sBJ2VRt92r4bOXKJnaqWaYyh-2Hpiy6mSWFhTiwSB9zI534I9ZH64veGigsE_CT23soZXrkohd_0duyrGvFi8Qf2e2eZzl4cTdKoBgjNM6jUX2GhPimhTJIXsipJgQ',
  securityAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVOXACIONwUpdtd5QMH-7yHG64tsdeoh-9nXr1OW1Fgef4LsxHelf8acYOPgv678PUi7Zwl5B_3UWdT2q80w7cppMtTSIN7runfaZLCAQrPLe9Q-KgzTwgvCzHXnumspwNJ7Y_tVhJreCpYKvAzXEBUkTYPGHRW6UrIGIqL9tlwLbNrJdkuaq6wZ0NQqDEIVAAVtduKZt3kTmkmYh2YLNbi-k7nRx9TdRr5bme7Yd_PiERqOkIj1vghQ',
  galaBackground: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzT82FkKce-zlECJXFIhn5fAlPQaAPhtDx5C8Z1xTQ0w8O66DI4nti6dEek-Ts6pFZu6ILKwjVGXqLNQAxjR8ZGDZxnUwFvLqqV5DJOq8WnUEvtIwNYpJ-kH2Xg1UiJS5GmMAwtrA8-RtYm1YoYYeVieo_LZU1G_kgYiyOeQeHrZgDui8xKi53WyecGtdBO1ac8h0e4f_uwmoNWR44DRZ31jsYWkR9TDpyqwzagXWjFqfeNJX8yKk_BQ',
  appScreen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqVLSO3Hs8FIwRpoiOPW7s3mmzp21Yr-PVuZdQi_IOELSiR2fbwmPWa0FrSvzy823ImT0XH_ovw4Q3DIawUdUFpsEJqM9X0AXpdEuDFnO4jozZeR4xDlwdVbv1QisaLjcfM5HNSPR0MvHppyODS3W1jSKYmVXfZwwLh02nEQuYT5vt-ebVUftOuGr-cWqNUpij3uXPeMnVvKjccVBQ7IN5c4o11YBoU5H1Op3sfCfWc-bSrNe1TKeXhg',
};

export type CategoryType = 'cleaning' | 'waiter' | 'security' | 'photography' | 'bartender' | 'dj';

export interface Category {
  id: CategoryType;
  name: string;
  iconName: string;
  description: string;
}

/*
 * Categorias exibidas como vitrine (sem busca/filtro nesta landing).
 * TODO: lista final de categorias do lançamento ainda pendente no PAGE_CONCEPT
 * (faltam ex.: Cerimonial, Decoração).
 */
export const CATEGORIES: Category[] = [
  { id: 'cleaning',    name: 'Faxina',     iconName: 'Brush',      description: 'Limpeza e organização pré e pós-evento.' },
  { id: 'waiter',      name: 'Garçom',     iconName: 'Utensils',   description: 'Serviço de alimentos e bebidas com etiqueta impecável.' },
  { id: 'security',    name: 'Segurança',  iconName: 'Shield',     description: 'Controle de acesso, vigilância e proteção.' },
  { id: 'photography', name: 'Fotografia', iconName: 'Camera',     description: 'Cobertura fotográfica dos seus melhores momentos.' },
  { id: 'bartender',   name: 'Bartender',  iconName: 'GlassWater', description: 'Coquetéis autorais e drinks clássicos.' },
  { id: 'dj',          name: 'Som/DJ',     iconName: 'Music',      description: 'Sonorização e entretenimento musical profissional.' },
];
