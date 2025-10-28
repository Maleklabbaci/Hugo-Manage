

import React from 'react';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
  PlusCircle,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  AlertCircle,
  X,
  Loader2,
  Menu,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PackageX,
  Languages,
  RefreshCw,
  History,
  ShoppingCart,
  Archive,
  CreditCard,
  PiggyBank,
  Undo2,
  Copy,
  Search,
  Database,
  Upload,
  Download,
  Server,
  Bell,
  ClipboardEdit,
  ArrowUp,
  ArrowDown,
  Truck,
  CheckCircle2,
  Eye,
  Bot,
  Sparkles,
  Lightbulb,
  Camera,
  ExternalLink,
  PlayCircle,
} from 'lucide-react';

export const ChezHugoLogo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`relative inline-block ${className}`}>
            <svg viewBox="0 0 200 80" className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] z-0 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round">
                <path d="M 5.61,41.28 C 17.57,31.58 60.35,22.27 89.2,35.3 c 21.03,9.48 48.5,13.22 71.55,2.69 c 22.18,-10.15 35.83,-2.32 36.33,1.48" />
                <path d="M 194.39,40.72 C 182.43,50.42 139.65,59.73 110.8,46.7 c -21.03,-9.48 -48.5,-13.22 -71.55,-2.69 C 17.07,54.16 3.42,46.33 2.92,42.53" />
            </svg>
            <div style={{ fontFamily: "'Permanent Marker', cursive" }} className="relative z-10 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                <span className="block text-sm leading-none text-center tracking-wider">CHEZ</span>
                <span className="text-4xl leading-none">HUGO</span>
            </div>
        </div>
    )
}


export {
  LayoutDashboard as DashboardIcon,
  Package as ProductsIcon,
  BarChart3 as StatsIcon,
  Settings as SettingsIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  LogOut as LogoutIcon,
  PlusCircle as AddIcon,
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MoreVertical as MoreVerticalIcon,
  AlertCircle as AlertCircleIcon,
  X as XIcon,
  Loader2 as LoaderIcon,
  Menu as MenuIcon,
  ShoppingBag as ShoppingBagIcon,
  DollarSign as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PackageX as PackageXIcon,
  Languages as LanguagesIcon,
  RefreshCw as RefreshCwIcon,
  History as HistoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Archive as ArchiveIcon,
  CreditCard as CreditCardIcon,
  PiggyBank as PiggyBankIcon,
  Undo2 as UndoIcon,
  Copy as DuplicateIcon,
  Search as SearchIcon,
  Database as DatabaseIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Server as ServerIcon,
  Bell as NotificationIcon,
  ClipboardEdit as BulkEditIcon,
  ArrowUp as SortAscIcon,
  ArrowDown as SortDescIcon,
  Truck as DeliveryIcon,
  CheckCircle2 as MarkDeliveredIcon,
  Eye as ViewDetailsIcon,
  Bot as BotIcon,
  Sparkles as SparklesIcon,
  Lightbulb as LightbulbIcon,
  Camera as CameraIcon,
  ExternalLink as ExternalLinkIcon,
  PlayCircle as RunIcon,
};