import { Loader } from '@/components/groups/loader';
import { groupTabs } from '../tab';
import { CategoryHeaderWithCreate } from '@/components/groups/category-header-with-create';

export default function Page() {
  return (
    <>
      <CategoryHeaderWithCreate title="Groups" tabs={groupTabs} />
      <div className="mt-6">
        <Loader sourcePath="groups" />
      </div>
    </>
  );
}
