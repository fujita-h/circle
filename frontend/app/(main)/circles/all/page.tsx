import { Loader } from '@/components/circles/loader';
import { circleTabs } from '../tab';
import { CategoryHeaderWithCreate } from '@/components/circles/category-header-with-create';

export default function Page() {
  return (
    <>
      <CategoryHeaderWithCreate title="Circles" tabs={circleTabs} />
      <div className="mt-6">
        <Loader sourcePath="circles" />
      </div>
    </>
  );
}
