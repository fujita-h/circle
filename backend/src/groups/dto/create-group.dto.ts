export class CreateGroupDto {
  status?: 'NORMAL' | 'DELETED';
  handle: string;
  name: string;
  description?: string;
  joinGroupCondition?: 'DENIED' | 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED';
  writeNotePermission?: 'ADMIN' | 'MEMBER' | 'ALL';
  readNotePermission?: 'ADMIN' | 'MEMBER' | 'ALL';
}
