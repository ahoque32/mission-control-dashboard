'use client';

/**
 * Icon Component - Bootstrap Icons wrapper for Mission Control
 * 
 * Provides a consistent interface for rendering Bootstrap Icons as React components.
 * Uses react-bootstrap-icons for tree-shakeable SVG icons.
 * 
 * Usage:
 *   <Icon name="people-fill" size={20} className="text-emerald-400" />
 *   <Icon name="speedometer2" size={24} />
 */

import {
  // Navigation icons
  Speedometer2,
  Kanban,
  Cpu,
  Activity,
  FileText,
  Calendar3,
  Search,
  Wallet2,

  // Section header icons
  PeopleFill,
  BarChart,
  GraphUpArrow,
  ListTask,
  HeartPulse,

  // Agent icons
  Robot,
  Book,
  ShieldCheck,
  Eye,
  Binoculars,

  // Activity type icons
  CheckCircleFill,
  RocketTakeoff,
  Send,
  Chat,
  Wrench,
  GraphUp,
  Tree,
  ExclamationTriangleFill,
  XCircleFill,
  PencilSquare,
  PlayFill,
  FlagFill,
  Link45deg,
  ArrowRepeat,
  PersonFill,
  FileEarmarkText,
  PinMapFill,
  Inbox,
  Clock,

  // Level badges
  TrophyFill,
  LightningFill,
  TreeFill,

  // Misc
  Folder2Open,
  ClipboardData,
  ExclamationTriangle,
  Stopwatch,
  Broadcast,
  CashCoin,
  CurrencyDollar,
  CheckLg,
  Mailbox2,
  Circle,
  QuestionCircle,
  PersonX,
} from 'react-bootstrap-icons';
import type { Icon as IconType } from 'react-bootstrap-icons';

// Map of icon names to components
const ICON_MAP: Record<string, IconType> = {
  // Navigation
  'speedometer2': Speedometer2,
  'kanban': Kanban,
  'cpu': Cpu,
  'activity': Activity,
  'file-text': FileText,
  'calendar3': Calendar3,
  'search': Search,
  'wallet2': Wallet2,

  // Section headers
  'people-fill': PeopleFill,
  'bar-chart': BarChart,
  'graph-up-arrow': GraphUpArrow,
  'list-task': ListTask,
  'heart-pulse': HeartPulse,

  // Agent icons
  'robot': Robot,
  'book': Book,
  'shield-check': ShieldCheck,
  'eye': Eye,
  'binoculars': Binoculars,

  // Activity types
  'check-circle-fill': CheckCircleFill,
  'rocket-takeoff': RocketTakeoff,
  'send': Send,
  'chat': Chat,
  'wrench': Wrench,
  'graph-up': GraphUp,
  'tree': Tree,
  'exclamation-triangle-fill': ExclamationTriangleFill,
  'x-circle-fill': XCircleFill,
  'pencil-square': PencilSquare,
  'play-fill': PlayFill,
  'flag-fill': FlagFill,
  'link-45deg': Link45deg,
  'arrow-repeat': ArrowRepeat,
  'person-fill': PersonFill,
  'file-earmark-text': FileEarmarkText,
  'pin-map-fill': PinMapFill,
  'inbox': Inbox,
  'clock': Clock,

  // Level badges
  'trophy-fill': TrophyFill,
  'lightning-fill': LightningFill,
  'tree-fill': TreeFill,

  // Misc
  'folder2-open': Folder2Open,
  'clipboard-data': ClipboardData,
  'exclamation-triangle': ExclamationTriangle,
  'stopwatch': Stopwatch,
  'broadcast': Broadcast,
  'cash-coin': CashCoin,
  'currency-dollar': CurrencyDollar,
  'check-lg': CheckLg,
  'mailbox2': Mailbox2,
  'circle': Circle,
  'question-circle': QuestionCircle,
  'person-x': PersonX,
};

interface IconProps {
  /** Bootstrap Icon name (e.g., 'people-fill', 'speedometer2') */
  name: string;
  /** Size in pixels (default: 16) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Custom color */
  color?: string;
  /** Title for accessibility */
  title?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 16, className = '', color, title, style }: IconProps) {
  const IconComponent = ICON_MAP[name];
  
  if (!IconComponent) {
    // Fallback: render nothing for unknown icons (avoids breaking the UI)
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Icon] Unknown icon name: "${name}"`);
    }
    return null;
  }

  return (
    <IconComponent
      size={size}
      className={className}
      color={color}
      title={title}
      style={style}
    />
  );
}

// Re-export for direct usage when needed
export { ICON_MAP };

// Type for valid icon names (string since ICON_MAP uses Record<string, ...>)
export type IconName = string;
