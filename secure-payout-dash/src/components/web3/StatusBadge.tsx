import { cn } from "@/lib/utils";

const MAP = {
  success: { label: "Success", cls: "text-success border-success/30 bg-success/10" },
  pending: { label: "Pending", cls: "text-warning border-warning/30 bg-warning/10" },
  failed: { label: "Failed", cls: "text-destructive border-destructive/30 bg-destructive/10" },
} as const;

export function StatusBadge({ status }: { status: string }) {
  const item = MAP[status as keyof typeof MAP] ?? MAP.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        item.cls,
      )}
    >
      <span className="status-dot" />
      {item.label}
    </span>
  );
}
