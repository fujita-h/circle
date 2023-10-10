import { redirect } from 'next/navigation';

export default async function Redirect({ params }: { params: any }) {
  redirect(`/topics/${params.handle}/notes`);
}
