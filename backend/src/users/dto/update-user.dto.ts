import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends CreateUserDto {}
export class UpdatePartialUserDto extends PartialType(CreateUserDto) {}
