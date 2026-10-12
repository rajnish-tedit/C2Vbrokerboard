"use client";

import {
  ArrowLeftRight,
  Bell,
  FileText,
  Landmark,
  TriangleAlert,
  Undo2,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterPills } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime } from "@/lib/domain/dates";
import type { NotificationKind } from "@/lib/domain/types";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

const ICONS: Record<
  NotificationKind,
  { icon: typeof Bell; className: string }
> = {
  stripe_setup: { icon: Landmark, className: "bg-amber-50 text-amber-700" },
  statement_ready: { icon: FileText, className: "bg-navy-50 text-navy-700" },
  payout_transferred: {
    icon: ArrowLeftRight,
    className: "bg-sky-50 text-sky-700",
  },
  bank_paid: { icon: Landmark, className: "bg-emerald-50 text-emerald-700" },
  payout_failed: { icon: TriangleAlert, className: "bg-rose-50 text-rose-700" },
  commission_adjustment: {
    icon: Undo2,
    className: "bg-amber-50 text-amber-700",
  },
  new_vendor: { icon: UserPlus, className: "bg-violet-50 text-violet-700" },
};

export function NotificationsView() {
  const demo = useDemo();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const list = demo.broker.notifications;
  const isRead = (id: string) => demo.state.readNotificationIds.includes(id);
  const visible = list.filter((n) => filter === "all" || !isRead(n.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Statements, payouts, adjustments and payout-account alerts. Select one to open the related page."
        actions={
          <Button
            variant="secondary"
            onClick={() => demo.markRead(list.map((n) => n.id))}
            disabled={demo.unreadCount === 0}
          >
            Mark all as read
          </Button>
        }
      />
      <Card>
        <div className="border-b border-slate-100 p-4">
          <FilterPills
            label="Notification filter"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: list.length },
              { value: "unread", label: "Unread", count: demo.unreadCount },
            ]}
          />
        </div>
        {visible.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-5 w-5" />}
            title={
              filter === "unread"
                ? "You're all caught up"
                : "No notifications yet"
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((n) => {
              const { icon: Icon, className } = ICONS[n.kind];
              const unread = !isRead(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      demo.markRead([n.id]);
                      router.push(n.href);
                    }}
                    className={cn(
                      "flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-slate-50",
                      unread && "bg-navy-50/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        className,
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm text-navy-950",
                            unread ? "font-semibold" : "font-medium",
                          )}
                        >
                          {n.title}
                        </span>
                        {unread && (
                          <span className="rounded-full bg-gold px-1.5 text-[10px] font-bold uppercase text-navy-950">
                            New
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-600">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
