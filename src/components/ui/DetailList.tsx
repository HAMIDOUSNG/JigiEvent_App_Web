export function DetailList({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>;
}

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-label">{label}</dt>
      <dd className="text-body-sm text-foreground mt-1">{value}</dd>
    </div>
  );
}
