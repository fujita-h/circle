import { Loader as ItemListLoader } from '@/components/items/loader';

export default function Page({ params }: { params: any }) {
  return (
    <>
      <ItemListLoader sourcePath={`groups/handle/${params.handle}/items`} />
    </>
  );
}
