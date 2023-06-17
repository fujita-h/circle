import { Loader as UserListLoader } from '@/components/users/loader';
import { userTabs } from '../tab';
import { UserCategoryHeader } from '@/components/users/header';

export default function Page() {
  return (
    <>
      <UserCategoryHeader title="Users" tabs={userTabs} />
      <div className="mt-6">
        <UserListLoader sourcePath="users" />
      </div>
    </>
  );
}
