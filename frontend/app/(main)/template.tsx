import { NavbarWithSearch } from '@/components/navbar/navbar-with-search';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen max-w-screen-2xl mx-auto bg-slate-100">
      <NavbarWithSearch />
      {children}
    </div>
  );
}
