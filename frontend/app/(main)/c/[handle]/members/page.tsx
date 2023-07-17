import { CircleMemberLoader } from '@/components/circles/members';

export default function Page({ params }: { params: any }) {
  return <CircleMemberLoader sourcePath={`circles/handle/${params.handle}/members`} />;
}
