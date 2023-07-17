export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 md:p-8">
      <div className="bg-white rounded-md p-4">{children}</div>
    </div>
  );
}
