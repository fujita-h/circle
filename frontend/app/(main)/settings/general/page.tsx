import { UpdateGeneralSettingForm } from '@/components/settings/update-general-setting-form';

export default function Page() {
  return (
    <>
      <div className="divide-y divide-white/5">
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">表示設定</h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">サイトの表示に関する設定</p>
          </div>
          <UpdateGeneralSettingForm />
        </div>
      </div>
    </>
  );
}
