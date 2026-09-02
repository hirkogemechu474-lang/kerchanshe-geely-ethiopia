import {
  Home,
  Car,
  Wrench,
  MapPin,
  Phone,
  Info,
  Newspaper,
  Settings,
  CreditCard,
  Calendar,
  FileText,
  GitCompare,
  Sliders,
  LogIn,
  UserPlus,
  Search,
  HelpCircle,
  Star,
  Shield,
  Zap,
  Clock,
  Award,
  Users,
  MessageCircle,
  TrendingUp,
  BookOpen,
  CheckCircle,
  Mail,
  Globe,
  type LucideIcon,
} from 'lucide-react';

interface NavIcon {
  icon: LucideIcon;
  label: string;
}

export interface SiteNavItem {
  id?: string;
  label: string;
  href?: string;
  icon?: string | null;
  children?: SiteNavItem[];
  isActive?: boolean;
  target?: string;
  rel?: string;
  placement?: string;
  displayOrder?: number;
  openInNewTab?: boolean;
}

const navIcons: Record<string, NavIcon> = {
  home: { icon: Home, label: 'Home' },
  models: { icon: Car, label: 'Models' },
  services: { icon: Wrench, label: 'Services' },
  dealers: { icon: MapPin, label: 'Dealers' },
  contact: { icon: Phone, label: 'Contact' },
  about: { icon: Info, label: 'About' },
  news: { icon: Newspaper, label: 'News' },
  parts: { icon: Settings, label: 'Parts' },
  financing: { icon: CreditCard, label: 'Financing' },
  testDrive: { icon: Calendar, label: 'Test Drive' },
  quote: { icon: FileText, label: 'Quote' },
  compare: { icon: GitCompare, label: 'Compare' },
  configurator: { icon: Sliders, label: 'Configurator' },
  login: { icon: LogIn, label: 'Login' },
  register: { icon: UserPlus, label: 'Register' },
  search: { icon: Search, label: 'Search' },
  faq: { icon: HelpCircle, label: 'FAQ' },
  reviews: { icon: Star, label: 'Reviews' },
  warranty: { icon: Shield, label: 'Warranty' },
  ev: { icon: Zap, label: 'Electric' },
  technology: { icon: Clock, label: 'Technology' },
  offers: { icon: Award, label: 'Offers' },
  testimonials: { icon: Users, label: 'Testimonials' },
  roadside: { icon: TrendingUp, label: 'Roadside' },
  privacy: { icon: BookOpen, label: 'Privacy' },
  terms: { icon: CheckCircle, label: 'Terms' },
  email: { icon: Mail, label: 'Email' },
  website: { icon: Globe, label: 'Website' },
  chat: { icon: MessageCircle, label: 'Chat' },
};

export function getNavIcon(key: string): NavIcon | undefined {
  return navIcons[key];
}

export function resolveNavIcon(key: string | null | undefined): LucideIcon | undefined {
  if (!key) return undefined;
  return navIcons[key]?.icon;
}

export function getAllNavIcons(): Record<string, NavIcon> {
  return navIcons;
}

export default navIcons;
