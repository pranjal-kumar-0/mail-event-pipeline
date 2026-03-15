import { Theme } from "../hooks/useTheme";

export function ThemeToggle({ theme, toggle, dark }: {
  theme: Theme;
  toggle: (e?: React.MouseEvent) => void;
  dark: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        className="relative flex items-center justify-center w-8 h-8 rounded-xl border transition-all duration-300"
        style={{
          borderColor: dark ? "#2a2d36" : "#e4e7ed",
          background: dark ? "#1e2029" : "rgba(255,255,255,0.8)",
        }}
      >
        {theme === "dark" ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#9da3b0" strokeWidth={1.8}>
            <circle cx="12" cy="12" r="5" />
            <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#9da3b0" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </button>
    </div>
  );
}
