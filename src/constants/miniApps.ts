export interface MiniAppGradient {
  from: string;
  to: string;
}

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: MiniAppGradient;
  url: string;
  enabled: boolean;
}

export const MINI_APPS: MiniApp[] = [
  {
    id: 'stareduca_senior',
    name: 'StarEduca Senior',
    description: 'Educación y rutas de transformación para padres',
    icon: 'school',
    color: '#6366f1',
    gradient: { from: '#6366f1', to: '#9333ea' },
    url: 'https://stareduca-senior.starbizacademy.com',
    enabled: true,
  },
];

export const getMiniAppById = (id: string): MiniApp | undefined => {
  return MINI_APPS.find((app) => app.id === id);
};

export default MINI_APPS;
