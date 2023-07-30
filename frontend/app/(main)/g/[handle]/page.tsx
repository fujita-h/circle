import { redirect } from 'next/navigation';

export default async function Redirect({ params }: { params: any }) {
  const handle = params.handle;

  redirect(`/g/${handle}/notes`);
}
