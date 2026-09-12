export function Callout({ children, type = "info" }: { children: React.ReactNode; type?: string }) {
  return (
    <div className={`my-5 border border-border border-l-4 bg-muted/50 p-4 text-sm ${type === "warning" ? "border-l-[hsl(var(--signal-route))]" : "border-l-primary"}`}>
      {children}
    </div>
  );
}
