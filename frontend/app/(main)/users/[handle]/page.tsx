import { redirect } from 'next/navigation';

export default async function Redirect({ params }: { params: any }) {
  redirect(`/users/${params.handle}/notes`);
}
