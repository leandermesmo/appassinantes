"use client";

import { Globe, Languages, Moon, Save, Sun } from "lucide-react";
import { useState } from "react";

export function GeneralPreferences() {
  const [language, setLanguage] = useState("pt-BR");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [theme, setTheme] = useState("dark");

  const timezones = [
    "America/Sao_Paulo",
    "UTC",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
    "Europe/Berlin",
  ];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Globe className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Preferências Gerais</h3>
      </div>

      <div className="space-y-6">
        {/* Idioma */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Languages className="w-4 h-4" /> Idioma
          </label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
          >
            <option value="pt-BR">🇧🇷 Português (pt-BR)</option>
            <option value="en-US">🇺🇸 English (en-US)</option>
          </select>
        </div>

        {/* Fuso Horário */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Fuso Horário
          </label>
          <div className="relative">
            <select 
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
              <Globe className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Tema */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} Tema
          </label>
          <div className="flex p-1 bg-zinc-800 rounded-xl border border-zinc-700">
            <button 
              onClick={() => setTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${theme === "dark" ? "bg-zinc-700 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <Moon className="w-4 h-4" /> Dark
            </button>
            <button 
              onClick={() => setTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${theme === "light" ? "bg-white text-zinc-900 shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <Sun className="w-4 h-4" /> Light
            </button>
          </div>
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-900/20 mt-4">
          <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Salvar preferências
        </button>
      </div>
    </div>
  );
}
