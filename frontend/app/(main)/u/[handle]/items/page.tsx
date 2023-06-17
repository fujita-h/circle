import { Loader as ItemListLoader } from '@/components/items/loader';

export default function Page({ params }: { params: any }) {
  return (
    <>
      <ItemListLoader sourcePath={`users/handle/${params.handle}/items`} />
    </>
  );
}
