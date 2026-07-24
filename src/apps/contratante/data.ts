import { Professional, BookingTeam, ClientEvent, Review } from './types';

export const MAP_BACKGROUND = "https://lh3.googleusercontent.com/aida-public/AB6AXuDfkGza65OUlqG_vQLwia77qJLsjvNebJeIZWk8oqoCTUoWcFUxMkWQdLKimcSQmAZWzal09jfkxk66wSHJzHKL4YcKZ25t4Y8eYSQ6s4ipKKd-FSQ0kOs4VKFKrU5aN7oATz7NVGdfkw9pjbc4UrXhlTZtNX9HQQiE3SqzTyoWrTWCpckLufAd49sSCxSNBNcsE0S1LPoXCadmpYQmVqDAqyspHnD76Du6WMDkM4Emf8U-j_C86TReaIuRKnzGIpdHCFjgs35JRQ";
export const MAP_MINI_PREVIEW = "https://lh3.googleusercontent.com/aida-public/AB6AXuBiXx44AFU-jz_WfXvc2H4pPSJObBfl48w3byPDXQnnCArGCZHjk2X0UMwcdQ8AoZ8ExiC6OZDE5rLXTRe085Uz8Lcz6aLCM_aqUGovrUr3HfdCnmlOFklc6GbKtK8exaDE44XlB9BM_2XjkFIZirKwHmDiEM4z5mxhHJP3NxiRBYEEgV27LKF0WSgYmWJi9t25WmAx6m7MjKabwDjjGA_IXfeJyZAhj-JX42zmkR7j2gYdbiPrQ8gfwvmK8_DKY-pBqYyMIj3tFg";
export const DECORATIVE_MAP = "https://lh3.googleusercontent.com/aida-public/AB6AXuCEPcfdxmPy14H4Jwwp3TFfGqGVVpMMSUtFLsJ9fXQZkmWEY7-v7Lp0BGfQpbRVyTmnYyBU5HxGrjZa-qyFg_FSrVkTjOvZ7sBaBQWByotVOu_8fTL9d9Wl59Ddh5cHEAL6rNjP0UzttsvMBdp1Ha94FuHHOZcTyiXWLALGOI2yyVxSl2-iQNvyUA9N-fiu09GRnbhjEFtl_SqWuCMv5vmiXtr0SYxSt99Rk2uHgfAv_dB_ZTNCsrk93iM-Pyg1cV_3Szqm9M3Uhg";

export const CLIENT_AVATARS = {
  rodrigoSmall: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaUMWEk5RR5cN45ze6awCxupOd_haLenYDV_07jaLAXx6CLXQDFMfrSdbAoPW85BULl4cHGbwD6kGnbdjOziYdkq4A69CUxyb88jK03BHY97p1x2p4-M7FlTVnCSYEvYlf3UMTfwQAPJIfx5gOByHHAR81N0ZQ5HQ3mE1vlJNa8XN1BVPsIAq7eFAa220QzsiEHKV9OESrhlW-Zhg1-6XB8VdNrhEd9HoiVAwsMVoPpf0JDwbbJ9rGMijkVIKdW31d0ooHujr20w",
  rodrigoLarge: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-wupK3d7zbGaRtSmZOWBDX2tWkSKQ7Kubnt2uG6z_MUAs-4pDQDbvyCHt8zG23_vi3oWWr8XuR-XVfapo7a8MZ1V-0cj7i6dbb8PA5nLDIA4oBJB91VkJRzMZFyK-5xeJkWeXah6iOg7RpGFXVBb-lGwgKQAK1Ev0mnuA5VMEFEPAkCImVLiQMmneEmezUdgzsDMqavjBIkhXw23bU80TNbMyM2lW7p3UdvPg3kAOBd_Bg5ugT8Dsqw0NXr4q921Jg9Ta7nDOeQ",
  mariana: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEanNh3wwDP0vHQKdbCzeC9Rs-rLxqnWf7R8vYRVTjUMuxhmsKAN7SEV-urycNkf4VXw0U4rKaTzIlFzMjLjWXLFb-e3Dk9kh9ObnjWMyGhDbbB_WuzsPNIkVz55OVksgH3i9xZQfd4QoyDvVF-eovWKxV0l64-PPaZ6r5V3dz8nvwhCANxlaZp0WwUzP2d3NIBomHyikAsToJv9KVdJ1uKjjPOFpVQwDgcvKJOb64NfVbVNn1NMkG8E1QZxLiIyIgv5jkuCjQdQ",
  bruno: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVT0Fk4ps1nPVTzuosgq1G7Wj5nq2xvDYUKcQJMXxScl6zYFyIEZd1F49_hLjv2j_PF5M9ANx4qPgLYmZ7z4YSrg4sMFlMutM9R4EU2yo4HYm8TkuNLXeA8jLjozb-KsnkA9IcRH_3gRKYH-MzLVisF-ncp2y_SBQINNb5lclPKK1pYuoeuxW_X73eO_MXfm_0r8qOewXNYJnbVFbFQvKV8epcdz78R0FGJ08sy23lPAjDd0qW6zK-eiTUWYOXws_uA0eKV6ceYA"
};

export const REVIEWS_RICARDO: Review[] = [
  {
    clientName: "Mariana Costa",
    rating: 5,
    text: "O Ricardo foi excepcional no nosso casamento. Super educado, ágil e muito proativo. Todos os convidados elogiaram o serviço de bar dele. Recomendo fortemente!",
    eventInfo: "Evento: Casamento Real • Setembro 2023",
    clientImage: CLIENT_AVATARS.mariana
  },
  {
    clientName: "Bruno Albuquerque",
    rating: 4.8,
    text: "Excelente profissional. Pontual e organizado. Contratamos para um evento corporativo de última hora e ele salvou nossa noite.",
    eventInfo: "Evento: Conference Tech • Outubro 23",
    clientImage: CLIENT_AVATARS.bruno
  }
];

export const RICARDO_PROFILE: Professional = {
  id: "ricardo-1",
  name: "Ricardo",
  category: "Garçom",
  role: "Garçom Especialista • Eventos de Luxo",
  rating: 4.9,
  status: "EM SERVIÇO",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBatOOGcNmH7uOEaKdULjeu1_1XcIXwkwKNRJFS_5cSHvaPIz02NsuKJHMTVnmiJPSOkWPKvWfeIFBASMM06HbUYroMrimTDDW78L04vy6QSEWuY0ODo0azuka159ioZNsfUHCnRYFJcNS5mPmZ7GM1e3Lhi_xbaSmtuKh4VKbul0HWheixVsqmaUmqYwGpMG8WYd2t8RPFywQCIXhMv7XMwv7_edaHXJNzK5fLArF-Py0Xb_SzC5HnwD72ZvaAopGKnNP4m90ZQ",
  successRate: 98,
  eventsCount: 142,
  skills: [
    "Serviço de Barman",
    "Buffet Francês",
    "Bilíngue (PT/EN)",
    "Sommelier Junior",
    "Coordenação de Equipe"
  ],
  reviews: REVIEWS_RICARDO,
  verified: true,
  transport: "Ricardo possui transporte próprio e disponibilidade para viagens curtas."
};

export const FAVORITE_PROFESSIONALS: Professional[] = [
  {
    id: "marcos-1",
    name: "Marcos Vinícius",
    category: "Som e Iluminação",
    role: "Fotografia Premium",
    rating: 5.0,
    status: "STANDBY",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCs8Zeyf-Mxm3xHtzcgavSvHFOVLPhE5LZyW2PcX4tcid_ec3_NknLuoznlqVuENQJJk9enlGIXdAc8rA1fTj-1Ere__pWB4BRE31zQyo1kFXIuMfZNzlHI5rt1_DuOuHqoALfcI9uGVPVnGP5rhJauzV1B0bvId_hHswhti3O77Inu8AtJrSknmFdLTB5AR9OFFIqZfXHSPTJyo7TKEh0KHlXFLlzeM8kANG1yW-mIsu83ftAxUSNakp2z11QRtUvUE9zRkAHrDA",
    successRate: 100,
    eventsCount: 96,
    skills: ["Fotografia de Moda", "Retratos Clássicos", "Edição Avançada"],
    reviews: [],
    verified: true,
    transport: "Transporte próprio em SP"
  },
  {
    id: "ana-1",
    name: "Chef Ana Luiza",
    category: "Garçom",
    role: "Buffet Gourmet",
    rating: 4.9,
    status: "EM SERVIÇO",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCt_G1IDXWr_8VwVNyw6Ty10oQK6XbA1TYI7IkFCgRg6xmTfumBm08S9ogNO-lXBZpluAH40seaein5rWYe0w2sFH7OqrbljozAhT_a4_jYnGqL3t4DD_bGYM0AqltbXtLtoODhL04TnWgEfCTZ41OYv_wz11bEYc0wPxVdKqNnrA5L_dpmsQXm8eBzLfMYGvDAk1zujv5ohIajHjJxAUe9Ky7nomg8iPaxuD3EsL-KVMRPRvpM4T13GZ1bohGaCECysLbH9vftzg",
    successRate: 99,
    eventsCount: 110,
    skills: ["Gastronomia Contemporânea", "Banquetes Corporativos", "Finger Foods"],
    reviews: [],
    verified: true,
    transport: "Possui estrutura própria para catering"
  },
  RICARDO_PROFILE
];

export const INITIAL_BOOKINGS: BookingTeam[] = [
  {
    id: "team-1",
    name: "Equipe de Garçons",
    status: "EM SERVIÇO",
    countConfirmed: 5,
    countReserve: 2,
    rating: 4.9,
    members: [
      RICARDO_PROFILE.image,
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA_8dgbxNBzx8hJo_O6Q7JvvumsRGUomZpCNBDIIprSyP5XSQXB7ZJv_V0fxPOXto3qV-6CG6Tee7DmfiOayfaPp5q-G_VtFZ43lCoT_Tr8H0ZLZrUPpKhMPX6ZA-xItb9o8f6wxO4idD5rPirIIdWVJaY2cKI8H7GZGArkt7zcEA1-uoDhtYUw64P8iyo1OUmrG4NR4NH8zhHXKPvbSdEY20ucsex-iLT6tfGnSIR_H9mj1suQ7r6r7YrC8c_2t7aHZxmFEXuP0A"
    ]
  },
  {
    id: "team-2",
    name: "Segurança",
    status: "EM TRÂNSITO",
    countConfirmed: 6,
    countReserve: 2,
    rating: 4.8,
    distance: "1.2 km",
    eta: "8 min",
    members: ["person_logo", "person_logo"]
  },
  {
    id: "team-3",
    name: "Limpeza & Manutenção",
    status: "STANDBY",
    countConfirmed: 12,
    countReserve: 0,
    rating: 4.7,
    members: []
  },
  {
    id: "team-4",
    name: "Som e Iluminação",
    status: "SETUP",
    countConfirmed: 4,
    countReserve: 1,
    rating: 4.9,
    setupPercentage: 85,
    members: []
  }
];

export const INITIAL_CLIENT_EVENTS: ClientEvent[] = [
  {
    id: "event-active",
    name: "Gala de Inverno 2024",
    date: "Hoje, 19:30",
    location: "Palácio das Artes, São Paulo",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzrhg17DelbqsZukhm2XDnXFtYhXUxOiYyM4ycQ4je0E9cvjZJOVBCQ64UQndwqeC35B_PX5ESueQWFdSaGXiFsa-Cis1gXPXVqXz1H0G9uKbBnTVKmigD1R_VOvl9KQ2MC9QFWGOG3JXoaqUrKDDS0ic3XBkfMcjVrIug2IdsjExs5sFnc64s189kNOuL8lZLXrcOf_QlllV6-bXChYLrfiMXNgloikrzyah0WZvUq7Juk6Xbu5S46aM8TgqCwh68fJr0gGcOzA",
    proCount: 42,
    status: "ATIVO"
  },
  {
    id: "event-1",
    name: "Aniversário de 30 Anos",
    date: "12 de Outubro, 2023",
    location: "Espaço Villa-Lobos, SP",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzrhg17DelbqsZukhm2XDnXFtYhXUxOiYyM4ycQ4je0E9cvjZJOVBCQ64UQndwqeC35B_PX5ESueQWFdSaGXiFsa-Cis1gXPXVqXz1H0G9uKbBnTVKmigD1R_VOvl9KQ2MC9QFWGOG3JXoaqUrKDDS0ic3XBkfMcjVrIug2IdsjExs5sFnc64s189kNOuL8lZLXrcOf_QlllV6-bXChYLrfiMXNgloikrzyah0WZvUq7Juk6Xbu5S46aM8TgqCwh68fJr0gGcOzA",
    proCount: 3,
    status: "CONCLUÍDO"
  },
  {
    id: "event-2",
    name: "Lançamento Tech Startup",
    date: "05 de Setembro, 2023",
    location: "Blue Note, São Paulo",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-ls8GhA2f5QlyCpq9lF7Ee3lfrP6Ap6CoxS2d2rEVduVcYA3Wt8OZ7gQF7eGk8tJQBpX7XQx4kQvd9Edp7JB-yMzsuX57izGATYXBElA-RKSuaP59Kc6xrF8DDIlvoIcvdbdho2gAPUcFBUxbXoBAoehqSsMWlJCfpLbAH89MLXhmUJvlWgp9Z_WdaY1_QWvERDEX7TOxg_vAwZYIh7UhgFCdWfvMev0uVizUUq7uCMZ8V7JTLsVAPvfLl3PaJ_3LgMzXMt16Vw",
    proCount: 1,
    status: "CONCLUÍDO"
  }
];

export const MAP_MARKERS_PRESET = [
  {
    id: "marker-dj",
    category: "DJ",
    iconName: "Headphones" as const,
    latPercent: 33,
    lngPercent: 25,
    eta: "4 min",
    details: "DJ Alok Cover - Equipado com Pioneer Nexus 2"
  },
  {
    id: "marker-waiter",
    category: "Garçom",
    iconName: "Utensils" as const,
    latPercent: 50,
    lngPercent: 66,
    eta: "8 min",
    details: "Ricardo M. e mais 4 garçons prontos para buffet"
  },
  {
    id: "marker-security",
    category: "Segurança",
    iconName: "Shield" as const,
    latPercent: 66,
    lngPercent: 33,
    eta: "12 min",
    details: "Vigilante Unidade Alpha - Treinado em primeiros socorros"
  },
  {
    id: "marker-cleaner",
    category: "Limpeza",
    iconName: "Sparkles" as const,
    latPercent: 40,
    lngPercent: 45,
    eta: "15 min",
    details: "Apoio de limpeza tática rápida para salão"
  }
];
