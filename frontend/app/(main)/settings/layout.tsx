export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-2 md:p-4">
      <div className="bg-white rounded-md p-4">{children}</div>
    </div>
  );
}
