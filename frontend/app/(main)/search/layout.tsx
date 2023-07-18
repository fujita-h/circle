export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-100 print:bg-white">
      <div className="max-w-screen-2xl mx-auto">{children}</div>
    </div>
  );
}
