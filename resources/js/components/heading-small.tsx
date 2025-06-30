export default function HeadingSmall({ title, description }: { title: string; description?: string }) {
  return (
    <header>
      <h3 className="mb-1 fs-6 fw-medium">{title}</h3>
      {description && <p className="small text-muted">{description}</p>}
    </header>
  );
}
