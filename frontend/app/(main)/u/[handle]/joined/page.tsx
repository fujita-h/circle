import { JoinedCircleListLoader } from '@/components/users/joined';

export default function Page({ params }: { params: any }) {
  return (
    <>
      <JoinedCircleListLoader sourcePath={`users/handle/${params.handle}/joined/circles`} />
    </>
  );
}
