import type { ObjectType } from "@/lib/types";

interface Props {
  type: ObjectType;
}

export default function TypeBadge({ type }: Props) {
  const styles =
    type === "contact"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";
  const label = type === "contact" ? "Contacts" : "Companies";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}
