"use client";

import { useEffect, useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "compi-theme";

function getStoredTheme(): ThemeMode | null {
    if (typeof window === "undefined") {
        return null;
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
}

function getPreferredTheme(): ThemeMode {
    if (typeof window === "undefined") {
        return "light";
    }

    const storedTheme = getStoredTheme();

    if (storedTheme) {
        return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getThemeSnapshot(): ThemeMode {
    return getPreferredTheme();
}

function subscribeThemeChange(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    return () => window.removeEventListener("storage", onStoreChange);
}

function applyTheme(theme: ThemeMode) {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function useTheme() {
    const theme = useSyncExternalStore(subscribeThemeChange, getThemeSnapshot, () => "light" as ThemeMode) as ThemeMode;

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    function toggleTheme() {
        applyTheme(theme === "dark" ? "light" : "dark");
        window.dispatchEvent(new Event("storage"));
    }

    return { theme, toggleTheme };
}
