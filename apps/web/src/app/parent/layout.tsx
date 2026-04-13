import type { ReactNode } from "react";

// Parent portal — light mode wrapper
// Applied via a CSS class on the wrapper div since Next.js doesn't allow nested <html>
export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="parent-mode-wrapper" style={{ colorScheme: "light" }}>
      {children}
    </div>
  );
}
