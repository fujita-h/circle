import { SetMetadata } from '@nestjs/common';

export const AuthorizedRolesAny = (...roles: string[]) => SetMetadata('roles', roles);
