export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-100 print:bg-white">
      <div className="max-w-screen-2xl mx-auto">
        <div className="p-2 md:p-4">
          <div className="bg-white rounded-md p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
