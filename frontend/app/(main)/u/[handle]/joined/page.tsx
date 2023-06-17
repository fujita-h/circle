import { JoinedGroupListLoader } from '@/components/users/joined';

export default function Page({ params }: { params: any }) {
  return (
    <>
      <JoinedGroupListLoader sourcePath={`user/joined/groups`} />
    </>
  );
}
