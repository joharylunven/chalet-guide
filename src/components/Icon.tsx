// Icônes (lucide, licence ISC). Les contenus JSON référencent les icônes par
// leur nom : ajouter ici tout nouveau nom utilisé dans src/content/.
import {
  Axe, Baby, Bath, Bed, Bike, ChefHat, CigaretteOff, Clock, Coffee, Droplet, Fan, Flame, Gamepad2, Heart,
  Map as MapIcon, PartyPopper, PawPrint, Receipt, Recycle, Sailboat, Scroll, ShoppingBasket, Snowflake, Sparkles,
  Speaker, Sun, Trees, Tv, Users, Utensils, WashingMachine, Waves, Wine, Moon,
  KeyRound, Wifi, House, ListChecks, DoorOpen, Siren, MapPin, ShoppingBag, MessageCircle, Copy, Check, Globe,
  ChevronLeft, Thermometer, Wind, Construction, QrCode, Printer, Phone, ExternalLink, Settings2, Info,
  TriangleAlert, X, Send, Menu, Hospital, Navigation, CircleCheck, CircleX, Eye, EyeOff, CloudOff, MessageSquareText,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  axe: Axe, baby: Baby, bath: Bath, bed: Bed, bike: Bike, 'chef-hat': ChefHat, 'cigarette-off': CigaretteOff,
  clock: Clock, coffee: Coffee, droplet: Droplet, fan: Fan, flame: Flame, 'gamepad-2': Gamepad2, heart: Heart,
  map: MapIcon, moon: Moon, 'party-popper': PartyPopper, paw: PawPrint, receipt: Receipt, recycle: Recycle,
  sailboat: Sailboat, scroll: Scroll, 'shopping-basket': ShoppingBasket, snowflake: Snowflake, sparkles: Sparkles,
  speaker: Speaker, sun: Sun, trees: Trees, tv: Tv, users: Users, utensils: Utensils,
  'washing-machine': WashingMachine, waves: Waves, wine: Wine,
  key: KeyRound, wifi: Wifi, house: House, 'list-checks': ListChecks, 'door-open': DoorOpen, siren: Siren,
  'map-pin': MapPin, 'shopping-bag': ShoppingBag, 'message-circle': MessageCircle, copy: Copy, check: Check,
  globe: Globe, 'chevron-left': ChevronLeft, thermometer: Thermometer, wind: Wind, construction: Construction,
  'qr-code': QrCode, printer: Printer, phone: Phone, 'external-link': ExternalLink, settings: Settings2,
  info: Info, warning: TriangleAlert, x: X, send: Send, hospital: Hospital, navigation: Navigation,
  'circle-check': CircleCheck, 'circle-x': CircleX, eye: Eye, 'eye-off': EyeOff, 'cloud-off': CloudOff,
  faq: MessageSquareText,
  menu: Menu,
}

export const iconNames = Object.keys(icons)

export function Icon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const C = icons[name] ?? Info
  return <C size={size} strokeWidth={1.8} aria-hidden="true" className={className} />
}
