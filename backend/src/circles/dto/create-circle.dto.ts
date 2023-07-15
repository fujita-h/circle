export class CreateCircleDto {
  status?: 'NORMAL' | 'DELETED';
  handle: string;
  name: string;
  description?: string;
  readNotePermission?: 'ADMIN' | 'MEMBER' | 'ALL';
  writeNotePermission?: 'ADMIN' | 'MEMBER' | 'ALL';
  writeNoteCondition?: 'REQUIRE_ADMIN_APPROVAL' | 'NOT_REQUIRED';
  joinCircleCondition?: 'REQUIRE_ADMIN_APPROVAL' | 'NOT_REQUIRED';
}
