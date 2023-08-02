import { Navbar } from '@/components/navbar';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="border-b">
        <Navbar />
      </div>
      <div>{children}</div>
    </div>
  );
}
