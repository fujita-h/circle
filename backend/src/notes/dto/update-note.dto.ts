import { PartialType } from '@nestjs/mapped-types';
import { CreateNoteDto } from './create-note.dto';

export class UpdateNoteDto extends CreateNoteDto {}
export class UpdatePartialNoteDto extends PartialType(UpdateNoteDto) {}
