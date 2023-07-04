import { NavbarWithSearch } from '@/components/navbar/navbar-with-search';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="bg-white border-b">
        <div className="max-w-screen-2xl mx-auto">
          <NavbarWithSearch />
        </div>
      </div>
      <div className="bg-slate-100 print:bg-white">
        <div className="max-w-screen-2xl mx-auto ">{children}</div>
      </div>
    </div>
  );
}
