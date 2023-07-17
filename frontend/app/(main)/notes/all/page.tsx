import { Loader as NoteListLoader } from '@/components/notes/loader';
import { itemTabs } from '../tab';
import { NotesCategoryHeader } from '@/components/notes/header';

export default function Page() {
  return (
    <>
      <NotesCategoryHeader title="Notes" tabs={itemTabs} />
      <div className="mt-6">
        <NoteListLoader sourcePath="notes" />
      </div>
    </>
  );
}
