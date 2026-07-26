export const THEME_STORAGE_KEY = "theme";
export const LIGHT_THEME = "bumblebee";
export const DARK_THEME = "dim";

export type Theme = typeof LIGHT_THEME | typeof DARK_THEME;

// Runs before hydration (inlined in <body>) so the correct daisyUI theme is
// applied on first paint instead of flashing the default light theme.
export const themeInitScript = `(function() {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = stored === ${JSON.stringify(DARK_THEME)} || stored === ${JSON.stringify(LIGHT_THEME)}
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? ${JSON.stringify(DARK_THEME)} : ${JSON.stringify(LIGHT_THEME)});
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();`;

const listeners = new Set<() => void>();

export function subscribeTheme(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getThemeSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

export function getServerThemeSnapshot(): Theme {
  return LIGHT_THEME;
}

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  listeners.forEach((listener) => listener());
}
