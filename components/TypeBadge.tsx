import type { ObjectType } from "@/lib/types";

interface Props {
  type: ObjectType;
}

export default function TypeBadge({ type }: Props) {
  const label = type === "contact" ? "Contacts" : "Companies";
  const styles =
    type === "contact"
      ? "bg-accent text-accent-foreground"
      : "bg-secondary text-secondary-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}
