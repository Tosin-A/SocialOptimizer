export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", zIndex: 1, backgroundColor: "#ffffff", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
