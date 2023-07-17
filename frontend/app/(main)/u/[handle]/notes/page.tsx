import { Loader } from '@/components/notes/loader';

export default function Page({ params }: { params: any }) {
  return (
    <>
      <Loader sourcePath={`users/handle/${params.handle}/notes`} />
    </>
  );
}
