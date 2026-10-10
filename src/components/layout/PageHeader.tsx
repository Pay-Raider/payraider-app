import type { ReactNode } from "react";

/**
 * The title block every page opens with: a short accent eyebrow, the page
 * title and one line saying what the page is for, with optional actions on
 * the right.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-sm font-medium text-accent">{eyebrow}</p>}
        <h1 className="mt-2 text-4xl font-semibold text-foreground md:text-5xl">{title}</h1>
        {description && <p className="mt-3 text-lg text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
