import { PartialType } from '@nestjs/mapped-types';
import { CreateCircleDto } from './create-circle.dto';

export class UpdateCircleDto extends CreateCircleDto {}
export class UpdatePartialCircleDto extends PartialType(UpdateCircleDto) {}
