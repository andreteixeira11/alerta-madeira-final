export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  created_at: string;
}

export type Category = 'ocorrencias' | 'opstop' | 'anomalias' | 'perdidos';

export interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  title: string;
  description: string | null;
  image_url: string;
  video_url: string | null;
  category: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  reactions_thumbs_up: string[];
  reactions_heart: string[];
  reactions_alert: string[];
  comments_count: number;
  created_at: string;
}

export interface PostWithCounts extends Post {
  total_reactions: number;
  user_reactions: string[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  text: string;
  created_at: string;
}

export interface Ad {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  active: boolean;
  position: 'top' | 'rotative';
  start_date: string | null;
  end_date: string | null;
  clicks_count: number;
  impressions_count: number;
  views_count: number;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string | null;
  token: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  link_url: string | null;
  sent_by: string;
  sent_at: string;
  recipients_count: number;
  opened_count: number;
}

export interface Municipality {
  name: string;
  latitude: number;
  longitude: number;
}

export interface FuelPrice {
  id: string;
  fuel_type: string;
  price: string;
  trend: 'up' | 'down' | 'stable';
  updated_at: string;
}

export interface JuntaFreguesia {
  id: string;
  freguesia: string;
  concelho: string;
  emails: string[];
  created_at: string;
  updated_at: string;
}

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'ocorrencias', label: 'Ocorrências' },
  { key: 'opstop', label: 'Op. Stop' },
  { key: 'anomalias', label: 'Anomalias' },
  { key: 'perdidos', label: 'Perdidos e Achados' },
];

export const REACTION_TYPES = ['👍', '👎', '❤️'] as const;

export const REACTION_MAP: Record<string, 'reactions_thumbs_up' | 'reactions_heart' | 'reactions_alert'> = {
  '👍': 'reactions_thumbs_up',
  '👎': 'reactions_alert',
  '❤️': 'reactions_heart',
};
