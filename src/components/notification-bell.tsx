"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";

import { getNotifications, markAllRead } from "@/app/notifications-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Notification = Awaited<ReturnType<typeof getNotifications>>[number];

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);

  useEffect(() => {
    if (open) getNotifications().then(setNotifications);
  }, [open]);

  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(true)} aria-label="Notifications">
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white">
            {unread}
          </span>
        )}
      </Button>
      <DialogContent className="max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>{unread > 0 ? `${unread} unread` : "You're all caught up."}</DialogDescription>
        </DialogHeader>

        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <>
            {unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await markAllRead();
                    setNotifications((ns) => ns.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
                  })
                }
              >
                Mark all read
              </Button>
            )}
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={n.read_at ? "text-muted-foreground" : "font-medium"}>{n.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(n.sent_at).toLocaleDateString()}
                    </span>
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
