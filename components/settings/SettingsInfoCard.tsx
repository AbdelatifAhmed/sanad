interface SettingsInfoCardProps {
  icon: string;
  title: string;
  description: string;
  badge: string;
}

export default function SettingsInfoCard({
  icon,
  title,
  description,
  badge,
}: SettingsInfoCardProps) {
  return (
    <article className="rounded-3xl border border-stitch-outline/15 bg-stitch-surface p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stitch-secondary-container/50 text-stitch-on-secondary-container">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="rounded-full border border-stitch-outline/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-stitch-on-surface-variant/70">
          {badge}
        </span>
      </div>
      <div className="mt-4">
        <h3 className="font-bold text-stitch-on-surface">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-stitch-on-surface-variant/70">{description}</p>
      </div>
    </article>
  );
}
