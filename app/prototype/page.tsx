import type { Metadata } from "next";
import PrototypeView from "@/components/prototype/PrototypeView";

export const metadata: Metadata = { title: "ABM Prototype" };

export default function PrototypePage() {
  return <PrototypeView />;
}
