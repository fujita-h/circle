import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDto } from './create-group.dto';

export class UpdateGroupDto extends CreateGroupDto {}
export class UpdatePartialGroupDto extends PartialType(UpdateGroupDto) {}
