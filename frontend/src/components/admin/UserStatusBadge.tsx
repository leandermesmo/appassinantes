import React from "react";
import { UserStatus } from "@/types/prisma";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface UserStatusBadgeProps {
  status: UserStatus;
  className?: string;
}

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  const statusStyles: Record<UserStatus, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: "bg-success/10", text: "text-success", label: "Ativo" },
    INACTIVE: { bg: "bg-text-muted/10", text: "text-text-muted", label: "Inativo" },
    SUSPENDED: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Suspenso" },
    BANNED: { bg: "bg-danger/10", text: "text-danger", label: "Banido" },
  };

  const style = statusStyles[status];

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center justify-center border border-current/20", style.bg, style.text, className)}>
      {style.label}
    </span>
  );
}
