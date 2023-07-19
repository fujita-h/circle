export class CreateGroupDto {
  status?: 'NORMAL' | 'DELETED';
  handle: string;
  name: string;
  description?: string;
  readNotePermission?: 'ADMIN' | 'MEMBER' | 'ALL';
  writeNotePermission?: 'ADMIN' | 'MEMBER' | 'ALL';
  writeNoteCondition?: 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED';
  joinGroupCondition?: 'DENIED' | 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED';
}
