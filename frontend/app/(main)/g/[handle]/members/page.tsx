import { GroupMemberLoader } from '@/components/groups/members';

export default function Page({ params }: { params: any }) {
  return <GroupMemberLoader sourcePath={`groups/handle/${params.handle}/members`} />;
}
