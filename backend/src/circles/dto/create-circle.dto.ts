export class CreateCircleDto {
  handle: string;
  name: string;
  description?: string;
  type?: 'OPEN' | 'PUBLIC' | 'PRIVATE';
}
