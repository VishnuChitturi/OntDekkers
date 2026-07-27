"use client";

/**
 * OntDekker — NotificationItem
 *
 * Inbox list item for the notification panel. Renders a type-coloured icon,
 * title, message preview, relative timestamp, and an unread indicator dot.
 *
 * This is a UI notification inbox item — NOT the Web Notifications API.
 *
 * Props: NotificationItemProps (see Notification.types.ts)
 *
 * Accessibility:
 *   - Renders as a <button> so it is keyboard-focusable and screen-reader-operable.
 *   - Icon containers are aria-hidden (decorative).
 *   - Unread dot carries an aria-label for screen readers.
 */

import { motion } from 'motion/react';
import {
  Heart,
  MessageCircle,
  UserPlus,
  Bell,
  Compass,
  Star,
  Mail,
  Users,
} from 'lucide-react';
import type { NotificationItemProps } from './Notification.types';
import type { NotificationType } from '@/types';

// ---------------------------------------------------------------------------
// Icon & colour maps
// ---------------------------------------------------------------------------

/** Maps each notification type to the matching Lucide icon component. */
const ICON_MAP: Record<NotificationType, React.ElementType> = {
  LIKE:             Heart,
  COMMENT:          MessageCircle,
  INVITE:           UserPlus,
  SYSTEM:           Bell,
  JOIN_REQUEST:     Users,
  EXPEDITION_UPDATE: Compass,
  GUIDE_REVIEW:     Star,
  MESSAGE:          Mail,
};

/**
 * Icon circle background + foreground classes per notification type.
 * Tailwind classes must be complete strings so the JIT scanner can detect them.
 */
const ICON_COLOUR_MAP: Record<NotificationType, string> = {
  LIKE:              'bg-red-50 text-red-500',
  COMMENT:           'bg-blue-50 text-blue-500',
  INVITE:            'bg-purple-50 text-purple-500',
  SYSTEM:            'bg-gray-100 text-charcoal',
  JOIN_REQUEST:      'bg-orange-50 text-orange-500',
  EXPEDITION_UPDATE: 'bg-green-50 text-moss-green',
  GUIDE_REVIEW:      'bg-amber-50 text-amber-600',
  MESSAGE:           'bg-indigo-50 text-indigo-500',
};

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

/**
 * Converts an ISO-8601 date string to a short human-readable relative label.
 * Uses Intl.RelativeTimeFormat for localisation-friendly output.
 */
function toRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = then - now;
  const diffSec = Math.round(diffMs / 1_000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr  = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr  / 24);
  const diffWk  = Math.round(diffDay / 7);
  const diffMo  = Math.round(diffDay / 30);
  const diffYr  = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60)  return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60)  return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHr)  < 24)  return rtf.format(diffHr,  'hour');
  if (Math.abs(diffDay) < 7)   return rtf.format(diffDay, 'day');
  if (Math.abs(diffWk)  < 5)   return rtf.format(diffWk,  'week');
  if (Math.abs(diffMo)  < 12)  return rtf.format(diffMo,  'month');
  return rtf.format(diffYr, 'year');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationItem({
  id,
  type,
  title,
  message,
  isRead,
  createdAt,
  onRead,
  onNavigate,
}: NotificationItemProps) {
  const Icon = ICON_MAP[type];
  const iconColours = ICON_COLOUR_MAP[type];
  const relativeTime = toRelativeTime(createdAt);

  function handleClick() {
    onRead?.(id);
    onNavigate?.(id);
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={[
        // Layout
        'w-full text-left flex items-start gap-3 px-4 py-3',
        // Unread: faint green tint + left accent border
        // Read: plain white with a subtle hover
        isRead
          ? 'bg-white hover:bg-gray-50 border-l-2 border-transparent'
          : 'bg-green-50/30 border-l-2 border-moss-green',
        // Transition for read→unread state changes
        'transition-colors duration-responsive',
        // Remove default button chrome
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
      ].join(' ')}
      aria-label={`${isRead ? 'Read' : 'Unread'} notification: ${title}`}
    >
      {/* ── Icon circle ───────────────────────────────────────────────────── */}
      <span
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${iconColours}`}
        aria-hidden="true"
      >
        <Icon
          className="w-4 h-4"
          strokeWidth={1.75}
          aria-hidden={true}
        />
      </span>

      {/* ── Text content ──────────────────────────────────────────────────── */}
      <span className="min-w-0 flex-1">
        {/* Title — bold when unread, medium when read */}
        <span
          className={`block text-sm text-ink leading-snug ${
            isRead ? 'font-medium' : 'font-semibold'
          }`}
        >
          {title}
        </span>

        {/* Message — two-line clamp */}
        <span className="block text-xs text-muted-slate mt-0.5 line-clamp-2 leading-relaxed">
          {message}
        </span>

        {/* Relative timestamp */}
        <span className="block text-[10px] font-mono text-muted-slate mt-1">
          {relativeTime}
        </span>
      </span>

      {/* ── Unread indicator dot ──────────────────────────────────────────── */}
      <span
        className={`shrink-0 self-center w-2 h-2 rounded-full bg-moss-green ${
          isRead ? 'invisible' : ''
        }`}
        aria-label={isRead ? undefined : 'Unread'}
        role={isRead ? undefined : 'status'}
      />
    </motion.button>
  );
}
