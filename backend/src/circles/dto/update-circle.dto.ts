import { PartialType } from '@nestjs/mapped-types';
import { CreateCircleDto } from './create-circle.dto';

export class UpdateCircleDto extends PartialType(CreateCircleDto) {}
