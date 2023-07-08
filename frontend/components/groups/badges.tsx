import { classNames } from '@/utils';

export function ReadItemPermissionBadge({ permission }: { permission: string }) {
  switch (permission) {
    case 'ADMIN':
      return <Badge label="管理者のみ閲覧可能" color="yellow" />;
    case 'GROUP_MEMBER':
      return <Badge label="メンバーが閲覧可能" color="green" />;
    case 'ALL':
      return <Badge label="誰でも閲覧可能" color="blue" />;
    default:
      return <></>;
  }
}

export function WriteItemPermissionBadge({ permission }: { permission: string }) {
  switch (permission) {
    case 'ADMIN':
      return <Badge label="管理者のみ投稿可能" color="yellow" />;
    case 'GROUP_MEMBER':
      return <Badge label="メンバーが投稿可能" color="green" />;
    case 'ALL':
      return <Badge label="誰でも投稿可能" color="blue" />;
    default:
      return <></>;
  }
}

export function WriteItemConditionBadge({ condition }: { condition: string }) {
  switch (condition) {
    case 'REQUIRE_ADMIN_APPROVAL':
      return <Badge label="記事の公開に管理者の承認が必要" color="red" />;
    default:
      return <></>;
  }
}

export function JoinConditionBadge({ condition }: { condition: string }) {
  switch (condition) {
    case 'REQUIRE_ADMIN_APPROVAL':
      return <Badge label="参加に管理者の承認が必要" color="red" />;
    default:
      return <></>;
  }
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={classNames(
        `text-${color}-800 bg-${color}-50 ring-${color}-600/20`,
        'rounded-md whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset',
      )}
    >
      {label}
    </span>
  );
}

function _DummyBadge() {
  return (
    <span
      className={classNames(
        'text-red-800 bg-red-50 ring-red-600/20',
        'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
        'text-green-800 bg-green-50 ring-green-600/20',
        'text-blue-800 bg-blue-50 ring-blue-600/20',
      )}
    ></span>
  );
}
