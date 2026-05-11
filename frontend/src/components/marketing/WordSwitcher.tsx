"use client";

import React, { useState, useEffect } from "react";

interface WordSwitcherProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function WordSwitcher({ words, interval = 2000, className = "" }: WordSwitcherProps) {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      
      // Pequeno delay para a animação de saída completar antes de trocar a palavra
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setIsTransitioning(false);
      }, 400); 
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span className="inline-grid h-[1.1em] overflow-hidden align-bottom">
      <span
        className={`inline-block transition-all duration-400 ease-in-out ${
          isTransitioning 
            ? "opacity-0 -translate-y-full" 
            : "opacity-100 translate-y-0"
        } ${className}`}
      >
        {words[index]}
      </span>
    </span>
  );
}
