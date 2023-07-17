import { redirect } from 'next/navigation';

export default async function Redirect() {
  redirect('/notes/all');
}
