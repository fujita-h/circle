export class CreateGroupMemberDto {
  userId: string;
  role: 'ADMIN' | 'MEMBER';
}
