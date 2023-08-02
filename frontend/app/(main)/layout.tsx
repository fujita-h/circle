import { Navbar } from '@/components/navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="bg-white">
        <div className="max-w-screen-2xl mx-auto">
          <Navbar />
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
