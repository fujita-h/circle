import { JoinedGroupListLoader } from '@/components/users/joined';

export default function Page({ params }: { params: any }) {
  return (
    <>
      <JoinedGroupListLoader sourcePath={`users/handle/${params.handle}/joined/groups`} />
    </>
  );
}
