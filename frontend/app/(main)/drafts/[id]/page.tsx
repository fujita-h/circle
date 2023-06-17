import { Loader as DraftsListLoader } from '@/components/drafts/loader';
import { Viewer } from '@/components/drafts/viewer';

export default function Page({ params }: { params: any }) {
  return (
    <>
      <div className="flex">
        <div className="w-96">
          <DraftsListLoader activeItemId={params.id} />
        </div>
        <div className="flex-1">
          <Viewer itemId={params.id} />
        </div>
      </div>
    </>
  );
}
