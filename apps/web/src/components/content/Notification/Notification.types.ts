import type { NotificationType } from '@/types';

export interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  onRead?: (id: string) => void;
  onNavigate?: (id: string) => void;
}
