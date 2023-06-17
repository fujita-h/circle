export class CreateGroupDto {
  handle: string;
  name: string;
  description?: string;
  type?: 'OPEN' | 'PUBLIC' | 'PRIVATE';
}
