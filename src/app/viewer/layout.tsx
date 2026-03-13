import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laser Power Viewer | LSM880",
  description: "Read-only laser power trend viewer for microscopy facility",
};

export default function ViewerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
