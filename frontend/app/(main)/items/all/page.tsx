import { Loader as ItemListLoader } from '@/components/items/loader';
import { itemTabs } from '../tab';
import { ItemCategoryHeader } from '@/components/items/header';

export default function Page() {
  return (
    <>
      <ItemCategoryHeader title="Items" tabs={itemTabs} />
      <div className="mt-6">
        <ItemListLoader sourcePath="items" />
      </div>
    </>
  );
}
