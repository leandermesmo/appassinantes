"use client";

import { Mail, ShieldCheck, User } from "lucide-react";
import Image from "next/image";

interface UserInfoCardProps {
  user: {
    name: string;
    email: string;
    image: string;
  };
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 p-1 bg-zinc-800">
            <Image
              src={user.image}
              alt={user.name}
              width={96}
              height={96}
              className="rounded-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1.5 rounded-full border-2 border-zinc-900" title="Conta Verificada Google">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-400">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="inline-flex items-center justify-center md:justify-start gap-2 bg-zinc-800/50 w-fit px-3 py-1 rounded-full border border-zinc-700/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-zinc-300">Conectado via Google</span>
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Identidade</span>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-zinc-800/50 flex items-center gap-2 text-xs text-zinc-500 italic">
        <ShieldCheck className="w-3 h-3" />
        Os dados acima são sincronizados automaticamente com sua conta Google e não podem ser alterados manualmente.
      </div>
    </div>
  );
}
