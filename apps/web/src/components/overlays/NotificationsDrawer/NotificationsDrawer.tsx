"use client";

/**
 * OntDekker NotificationsDrawer
 *
 * Bottom-sheet drawer that lists all inbox notifications for the
 * authenticated user. Opened by the bell icon in the Navbar via the
 * NOTIFICATIONS_DRAWER_TOGGLE dispatch.
 *
 * States:
 *   Empty   — no notifications yet
 *   Loaded  — list of NotificationItem rows
 *
 * Actions:
 *   Mark all read  — dispatches ALL_NOTIFICATIONS_READ
 *   Per-item read  — dispatches NOTIFICATION_READ
 *   Navigate       — dispatches NOTIFICATIONS_DRAWER_TOGGLE(close) then
 *                    navigateTo(targetView, targetId) if present
 */

import React from "react";
import { Bell } from "lucide-react";
import Drawer from "@/components/overlays/Drawer";
import { NotificationItem } from "@/components/content/Notification";
import Button from "@/components/feedback/Button";
import { useAppState } from "@/contexts/AppStateProvider";
import { useRouter } from "@/router/Router";
import type { ViewName } from "@/types";

export default function NotificationsDrawer() {
  const { state, dispatch } = useAppState();
  const { navigateTo } = useRouter();

  const { isNotificationsDrawerOpen, notifications, unreadNotificationsCount } = state;

  function handleClose() {
    dispatch({ type: "NOTIFICATIONS_DRAWER_TOGGLE", open: false });
  }

  function handleRead(id: string) {
    dispatch({ type: "NOTIFICATION_READ", notificationId: id });
  }

  function handleNavigate(id: string) {
    const notification = notifications.find((n) => n.id === id);
    if (notification?.targetView) {
      handleClose();
      navigateTo(
        notification.targetView as ViewName,
        notification.targetId ?? undefined
      );
    }
  }

  function handleMarkAllRead() {
    dispatch({ type: "ALL_NOTIFICATIONS_READ" });
  }

  return (
    <Drawer
      isOpen={isNotificationsDrawerOpen}
      onClose={handleClose}
      title="Notifications"
    >
      {/* ── Header actions ─────────────────────────────────────────────── */}
      {unreadNotificationsCount > 0 && (
        <div className="flex justify-end mb-2 -mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        </div>
      )}

      {/* ── Notification list ──────────────────────────────────────────── */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3 text-center">
          <Bell
            size={36}
            strokeWidth={1}
            className="text-gray-200"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-ink">
            You&apos;re all caught up.
          </p>
          <p className="text-xs text-muted-slate max-w-xs">
            New notifications for expeditions, messages, and activity will appear here.
          </p>
        </div>
      ) : (
        <div
          role="list"
          aria-label="Notifications"
          className="-mx-5 border-t border-gray-50"
        >
          {notifications.map((notification) => (
            <div key={notification.id} role="listitem">
              <NotificationItem
                id={notification.id}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                isRead={notification.isRead}
                createdAt={notification.createdAt}
                onRead={handleRead}
                onNavigate={handleNavigate}
              />
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
