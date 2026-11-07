import { ChevronDown } from "lucide-react";

/**
 * Styled <select>: hides the native arrow and draws a padded chevron.
 * Appearance and right padding are set inline so no stylesheet can override them.
 */
export default function Select({
  className = "",
  style,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`input ${className}`}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          paddingRight: "2.5rem",
          ...style,
        }}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        aria-hidden
      />
    </div>
  );
}
