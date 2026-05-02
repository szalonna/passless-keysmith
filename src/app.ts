import { generatePassword } from "./password-core.js";

const PREFERENCES_STORAGE_KEY = "passless.preferences.v1";
const THEMES = {
  ocean: {
    "--bg-start": "#d9ecff",
    "--bg-mid": "#b7f0dc",
    "--bg-end": "#9fd7ff",
    "--surface": "#ffffff",
    "--surface-soft": "#f8fcff",
    "--surface-border": "#d7e4ec",
    "--text": "#17324a",
    "--muted": "#5f7488",
    "--accent": "#0b7fab",
    "--accent-soft": "#d8f0f8",
    "--danger": "#a72323",
  },
  violet: {
    "--bg-start": "#dccbff",
    "--bg-mid": "#b69aff",
    "--bg-end": "#e6d8ff",
    "--surface": "#ffffff",
    "--surface-soft": "#f7f3ff",
    "--surface-border": "#d9d1ff",
    "--text": "#2a1d5a",
    "--muted": "#645b8a",
    "--accent": "rgb(109, 74, 255)",
    "--accent-soft": "#e8ddff",
    "--danger": "#a72323",
  },
  dracula: {
    "--bg-start": "#1f2230",
    "--bg-mid": "#3c2c58",
    "--bg-end": "#27314a",
    "--surface": "#353746",
    "--surface-soft": "#2f3140",
    "--surface-border": "#44475a",
    "--text": "#f8f8f2",
    "--muted": "#c5c8ba",
    "--accent": "#bd93f9",
    "--accent-soft": "#44475a",
    "--danger": "#ff5555",
  },
  "catppuccin-latte": {
    "--bg-start": "#f8dccb",
    "--bg-mid": "#f0e2b8",
    "--bg-end": "#d8e7ff",
    "--surface": "#ffffff",
    "--surface-soft": "#f5f7fa",
    "--surface-border": "#ccd0da",
    "--text": "#4c4f69",
    "--muted": "#6c6f85",
    "--accent": "#1e66f5",
    "--accent-soft": "#dce0e8",
    "--danger": "#d20f39",
  },
  "catppuccin-frappe": {
    "--bg-start": "#2a324a",
    "--bg-mid": "#4a345c",
    "--bg-end": "#31456b",
    "--surface": "#414559",
    "--surface-soft": "#373b4f",
    "--surface-border": "#51576d",
    "--text": "#c6d0f5",
    "--muted": "#a5adce",
    "--accent": "#ca9ee6",
    "--accent-soft": "#51576d",
    "--danger": "#e78284",
  },
  "catppuccin-mocha": {
    "--bg-start": "#181a2f",
    "--bg-mid": "#3a2552",
    "--bg-end": "#1f3656",
    "--surface": "#313244",
    "--surface-soft": "#272838",
    "--surface-border": "#45475a",
    "--text": "#cdd6f4",
    "--muted": "#a6adc8",
    "--accent": "#cba6f7",
    "--accent-soft": "#45475a",
    "--danger": "#f38ba8",
  },
  nord: {
    "--bg-start": "#253245",
    "--bg-mid": "#2f4f64",
    "--bg-end": "#3e4563",
    "--surface": "#434c5e",
    "--surface-soft": "#3a4252",
    "--surface-border": "#4c566a",
    "--text": "#eceff4",
    "--muted": "#d8dee9",
    "--accent": "#88c0d0",
    "--accent-soft": "#4c566a",
    "--danger": "#bf616a",
  },
  "oled-dark": {
    "--bg-start": "#000000",
    "--bg-mid": "#050505",
    "--bg-end": "#0d0d0d",
    "--surface": "#000000",
    "--surface-soft": "#0a0a0a",
    "--surface-border": "#1d1d1d",
    "--text": "#f5f5f5",
    "--muted": "#b8b8b8",
    "--accent": "#38bdf8",
    "--accent-soft": "#121212",
    "--danger": "#ff6b6b",
  },
  "bright-white": {
    "--bg-start": "#ffffff",
    "--bg-mid": "#f7faff",
    "--bg-end": "#eef5ff",
    "--surface": "#ffffff",
    "--surface-soft": "#fbfdff",
    "--surface-border": "#d8e6ff",
    "--text": "#0f2140",
    "--muted": "#3e587f",
    "--accent": "#0066ff",
    "--accent-soft": "#dfeaff",
    "--danger": "#c1121f",
  },
};

type ThemeName = keyof typeof THEMES;
type PreferenceKey = "useAlphabet" | "useNumbers" | "useBasic" | "useExtended" | "useAnyUnicode";

type Preferences = {
  theme: ThemeName;
  length: number;
} & Record<PreferenceKey, boolean>;

function getRequiredElement<T extends Element>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element as unknown as T;
}

function getRequiredQueryElement<T extends Element>(selector: string): T {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element as T;
}

const elements = {
  themeChooser: getRequiredElement<HTMLSelectElement>("themeChooser"),
  helpBtn: getRequiredElement<HTMLButtonElement>("helpBtn"),
  helpDialog: getRequiredElement<HTMLDialogElement>("helpDialog"),
  closeHelpBtn: getRequiredElement<HTMLButtonElement>("closeHelpBtn"),
  closePrivacyNoticeBtn: getRequiredElement<HTMLButtonElement>("closePrivacyNoticeBtn"),
  openPrivacyPolicyBtn: getRequiredElement<HTMLButtonElement>("openPrivacyPolicyBtn"),
  privacyNotice: getRequiredQueryElement<HTMLElement>(".privacy-notice"),
  privacyPolicyDialog: getRequiredElement<HTMLDialogElement>("privacyPolicyDialog"),
  closePrivacyPolicyBtn: getRequiredElement<HTMLButtonElement>("closePrivacyPolicyBtn"),
  toggleSecretBtn: getRequiredElement<HTMLButtonElement>("toggleSecretBtn"),
  username: getRequiredElement<HTMLInputElement>("username"),
  site: getRequiredElement<HTMLInputElement>("site"),
  secretPhrase: getRequiredElement<HTMLInputElement>("secretPhrase"),
  version: getRequiredElement<HTMLInputElement>("version"),
  length: getRequiredElement<HTMLInputElement>("length"),
  lengthSlider: getRequiredElement<HTMLInputElement>("lengthSlider"),
  useAlphabet: getRequiredElement<HTMLInputElement>("useAlphabet"),
  useNumbers: getRequiredElement<HTMLInputElement>("useNumbers"),
  useBasic: getRequiredElement<HTMLInputElement>("useBasic"),
  useExtended: getRequiredElement<HTMLInputElement>("useExtended"),
  useAnyUnicode: getRequiredElement<HTMLInputElement>("useAnyUnicode"),
  password: getRequiredElement<HTMLInputElement>("password"),
  error: getRequiredElement<HTMLElement>("error"),
  statusMessage: getRequiredElement<HTMLElement>("statusMessage"),
  copyBtn: getRequiredElement<HTMLButtonElement>("copyBtn"),
};

function setSecretVisibility(visible: boolean): void {
  elements.secretPhrase.type = visible ? "text" : "password";
  elements.toggleSecretBtn.textContent = visible ? "Hide" : "Show";
  elements.toggleSecretBtn.setAttribute("aria-pressed", visible ? "true" : "false");
  elements.toggleSecretBtn.setAttribute("aria-label", visible ? "Hide secret phrase" : "Show secret phrase");
}

function preferenceSnapshot() {
  return {
    theme: elements.themeChooser.value,
    length: Number.parseInt(elements.length.value, 10) || 20,
    useAlphabet: elements.useAlphabet.checked,
    useNumbers: elements.useNumbers.checked,
    useBasic: elements.useBasic.checked,
    useExtended: elements.useExtended.checked,
    useAnyUnicode: elements.useAnyUnicode.checked,
  };
}

function savePreferences() {
  try {
    globalThis.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferenceSnapshot()));
  } catch { }
}

function loadPreferences(): Partial<Preferences> | null {
  try {
    const raw = globalThis.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function applyPreferences(preferences: Partial<Preferences> | null): void {
  if (!preferences) return;
  if (typeof preferences.theme === "string" && THEMES[preferences.theme]) {
    elements.themeChooser.value = preferences.theme;
  }
  if (Number.isInteger(preferences.length)) {
    elements.length.value = String(preferences.length);
    elements.lengthSlider.value = String(preferences.length);
  }
  for (const key of ["useAlphabet", "useNumbers", "useBasic", "useExtended", "useAnyUnicode"] as const) {
    if (typeof preferences[key] === "boolean") {
      elements[key].checked = preferences[key];
    }
  }
}

function applyTheme(themeName: string): void {
  const resolvedTheme: ThemeName = themeName in THEMES ? (themeName as ThemeName) : "ocean";
  const selectedTheme: Record<string, string> = THEMES[resolvedTheme];
  for (const [key, value] of Object.entries(selectedTheme)) {
    document.documentElement.style.setProperty(key, value);
  }
}

function preferredThemeFromSystem() {
  const prefersDark = globalThis.matchMedia && globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "catppuccin-frappe" : "catppuccin-latte";
}

function currentConfig() {
  return {
    username: elements.username.value.trim(),
    site: elements.site.value.trim(),
    secretPhrase: elements.secretPhrase.value,
    version: Number.parseInt(elements.version.value, 10) || 0,
    length: Number.parseInt(elements.length.value, 10) || 20,
    useAlphabet: elements.useAlphabet.checked,
    useNumbers: elements.useNumbers.checked,
    useBasic: elements.useBasic.checked,
    useExtended: elements.useExtended.checked,
    useAnyUnicode: elements.useAnyUnicode.checked,
  };
}

let inFlight = 0;

function syncLengthInputs(source: "slider" | "number"): void {
  const min = Number.parseInt(elements.length.min, 10);
  const max = Number.parseInt(elements.length.max, 10);
  const raw = source === "slider" ? elements.lengthSlider.value : elements.length.value;
  const parsed = Number.parseInt(raw, 10);
  const fallback = Number.parseInt(elements.length.value, 10) || 20;
  const clamped = Number.isInteger(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
  elements.length.value = String(clamped);
  elements.lengthSlider.value = String(clamped);
}

async function regenerate() {
  const callId = ++inFlight;

  try {
    const nextPassword = await generatePassword(currentConfig());
    if (callId !== inFlight) {
      return;
    }

    elements.password.value = nextPassword;
    elements.password.type = "password";
    elements.error.textContent = "";
    elements.statusMessage.textContent = "";
  } catch (err) {
    if (callId !== inFlight) {
      return;
    }

    elements.password.value = "";
    elements.password.type = "password";
    const message = err instanceof Error ? err.message : String(err);
    elements.error.textContent = message;
    elements.statusMessage.textContent = "";
  }
}

for (const el of Object.values(elements)) {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (
      el === elements.length ||
      el === elements.lengthSlider
    ) {
      continue;
    }
    el.addEventListener("input", regenerate);
    el.addEventListener("change", regenerate);
  }
}

function handleLengthChange(source: "slider" | "number"): void {
  syncLengthInputs(source);
  savePreferences();
  regenerate();
}

function openHelpDialog() {
  elements.helpBtn.setAttribute("aria-expanded", "true");
  elements.helpDialog.showModal();
}

function closeHelpDialog() {
  elements.helpBtn.setAttribute("aria-expanded", "false");
  elements.helpDialog.close();
}

function openPrivacyPolicyDialog() {
  elements.privacyPolicyDialog.showModal();
}

function closePrivacyPolicyDialog() {
  elements.privacyPolicyDialog.close();
}

elements.themeChooser.addEventListener("change", () => {
  applyTheme(elements.themeChooser.value);
  savePreferences();
});
elements.toggleSecretBtn.addEventListener("click", () => {
  setSecretVisibility(elements.secretPhrase.type === "password");
});
elements.helpBtn.addEventListener("click", openHelpDialog);
elements.closeHelpBtn.addEventListener("click", closeHelpDialog);
elements.closePrivacyNoticeBtn.addEventListener("click", () => {
  elements.privacyNotice.hidden = true;
});
elements.openPrivacyPolicyBtn.addEventListener("click", openPrivacyPolicyDialog);
elements.closePrivacyPolicyBtn.addEventListener("click", closePrivacyPolicyDialog);
elements.helpDialog.addEventListener("click", (event) => {
  const rect = elements.helpDialog.getBoundingClientRect();
  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;
  if (!inside) {
    closeHelpDialog();
  }
});
elements.privacyPolicyDialog.addEventListener("click", (event) => {
  const rect = elements.privacyPolicyDialog.getBoundingClientRect();
  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;
  if (!inside) {
    closePrivacyPolicyDialog();
  }
});
elements.length.addEventListener("input", () => handleLengthChange("number"));
elements.length.addEventListener("change", () => handleLengthChange("number"));
elements.lengthSlider.addEventListener("input", () => handleLengthChange("slider"));
elements.lengthSlider.addEventListener("change", () => handleLengthChange("slider"));
for (const key of ["useAlphabet", "useNumbers", "useBasic", "useExtended", "useAnyUnicode"] as const) {
  elements[key].addEventListener("change", savePreferences);
}

elements.copyBtn.addEventListener("click", async () => {
  if (!elements.password.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(elements.password.value);
    elements.copyBtn.textContent = "Copied";
    elements.error.textContent = "";
    elements.statusMessage.textContent = "Password copied to clipboard.";
    setTimeout(() => {
      elements.copyBtn.textContent = "Copy";
    }, 1000);
  } catch {
    elements.error.textContent = "Unable to copy automatically. Please copy manually.";
    elements.statusMessage.textContent = "";
  }
});

elements.password.addEventListener("mouseenter", () => {
  if (elements.password.value) {
    elements.password.type = "text";
  }
});
elements.password.addEventListener("mouseleave", () => {
  elements.password.type = "password";
});

elements.themeChooser.value = preferredThemeFromSystem();
applyPreferences(loadPreferences());
applyTheme(elements.themeChooser.value);
setSecretVisibility(false);
syncLengthInputs("number");
regenerate();
