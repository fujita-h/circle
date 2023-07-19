import { Loader as ItemListLoader } from '@/components/notes/loader';

export default function Page({ params }: { params: any }) {
  return (
    <>
      <ItemListLoader sourcePath={`groups/handle/${params.handle}/notes`} />
    </>
  );
}
