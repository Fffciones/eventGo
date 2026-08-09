import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

/** Bloco de seção padronizado para as páginas legais. */
export function LegalSection({ title, children }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="font-display font-bold text-lg text-on-surface">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 marker:text-primary">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
