"use client";

import { useEffect } from "react";

export function DocumentLanguage({ locale }: { locale: string }) {
  useEffect(() => {
    const previousLanguage = document.documentElement.lang;
    document.documentElement.lang = locale;

    return () => {
      document.documentElement.lang = previousLanguage || "en";
    };
  }, [locale]);

  return null;
}
