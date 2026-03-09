import { Municipality } from '@/types';

export const MUNICIPALITIES: Municipality[] = [
  { name: 'Funchal', latitude: 32.6669, longitude: -16.9241 },
  { name: 'Câmara de Lobos', latitude: 32.6500, longitude: -16.9769 },
  { name: 'Santa Cruz', latitude: 32.6883, longitude: -16.7400 },
  { name: 'Machico', latitude: 32.7183, longitude: -16.7617 },
  { name: 'Santana', latitude: 32.8000, longitude: -16.8833 },
  { name: 'São Vicente', latitude: 32.7900, longitude: -16.9500 },
  { name: 'Porto Moniz', latitude: 32.8667, longitude: -17.1667 },
  { name: 'Calheta', latitude: 32.7167, longitude: -17.1667 },
  { name: 'Ponta do Sol', latitude: 32.6667, longitude: -17.1000 },
  { name: 'Ribeira Brava', latitude: 32.6500, longitude: -17.0667 },
  { name: 'Porto Santo', latitude: 33.0600, longitude: -16.3400 },
];

export const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Céu limpo', icon: '☀️' },
  1: { description: 'Quase limpo', icon: '🌤️' },
  2: { description: 'Parcialmente nublado', icon: '⛅' },
  3: { description: 'Nublado', icon: '☁️' },
  45: { description: 'Nevoeiro', icon: '🌫️' },
  48: { description: 'Nevoeiro gelado', icon: '🌫️' },
  51: { description: 'Chuvisco leve', icon: '🌦️' },
  53: { description: 'Chuvisco', icon: '🌦️' },
  55: { description: 'Chuvisco forte', icon: '🌧️' },
  61: { description: 'Chuva leve', icon: '🌧️' },
  63: { description: 'Chuva moderada', icon: '🌧️' },
  65: { description: 'Chuva forte', icon: '🌧️' },
  71: { description: 'Neve leve', icon: '🌨️' },
  73: { description: 'Neve moderada', icon: '🌨️' },
  75: { description: 'Neve forte', icon: '❄️' },
  80: { description: 'Aguaceiros leves', icon: '🌦️' },
  81: { description: 'Aguaceiros', icon: '🌧️' },
  82: { description: 'Aguaceiros fortes', icon: '⛈️' },
  95: { description: 'Trovoada', icon: '⛈️' },
  96: { description: 'Trovoada com granizo', icon: '⛈️' },
  99: { description: 'Trovoada forte', icon: '⛈️' },
};

export const FUEL_PRICES = [
  { type: 'Gasolina 95', price: '1.659', trend: 'up' as const },
  { type: 'Gasóleo', price: '1.549', trend: 'down' as const },
  { type: 'GPL Auto', price: '0.749', trend: 'stable' as const },
];
