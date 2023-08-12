import { redirect } from 'next/navigation';

export default async function Redirect({ params }: { params: any }) {
  redirect(`/u/${params.handle}/notes`);
}
