import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  ParseIntPipe,
  Post,
  Query,
  Param,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { AuthorizedRolesAny } from '../guards/jwt.roles.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotesService } from '../notes/notes.service';
import { AzblobService } from '../azblob/azblob.service';
import { RestError } from '@azure/storage-blob';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly notesService: NotesService,
    private readonly blobsService: AzblobService,
  ) {}

  @Get(':id')
  async getComment(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;
    // ToDo:
    // need to check this user can read comment.
    return this.commentsService.findOne({ where: { id }, include: { user: true } });
  }

  @Get(':id/md')
  async getCommentMarkdown(
    @Request() request: any,
    @Param('id') id: string,
    @Response() response: any,
  ) {
    const userId = request.user.id;
    // ToDo:
    // need to check this user can read comment.

    const comment = await this.commentsService.findOne({ where: { id: id } });
    if (!comment) throw new NotFoundException();
    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob(
        'comment',
        `${comment.id}/${comment.blobPointer}.md`,
      );
      response.setHeader('Content-Type', downloadBlockBlobResponse.contentType);
      downloadBlockBlobResponse.readableStreamBody?.pipe(response);
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode === 404) {
          throw new NotFoundException();
        }
      }
      throw new InternalServerErrorException();
    }
  }
}
