import { NavbarWithSearch } from '@/components/navbar/navbar-with-search';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="bg-slate-100">
        <div className="min-h-screen bg-white">
          <NavbarWithSearch />
          {children}
        </div>
      </div>
    </>
  );
}
