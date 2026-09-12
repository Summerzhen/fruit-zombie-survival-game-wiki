export function FAQ({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="signal-card my-5 border border-border bg-card/70 p-5">
      <p className="font-utility text-[10px] font-bold uppercase text-primary">Quick answer</p>
      <h4 className="mt-2 font-bold text-foreground">{question}</h4>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
