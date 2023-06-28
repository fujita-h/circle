import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { AuthorizedRolesAny } from '../guards/jwt.roles.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ItemsService } from '../items/items.service';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly itemsService: ItemsService,
  ) {}

  @Post()
  async create(@Request() request: any, @Body() data: CreateCommentDto) {
    const userId = request.user.id;
    const itemId = data.item.id;

    // check input
    if (!userId || !itemId) {
      throw new BadRequestException();
    }

    // check item
    const item = await this.itemsService.findOne({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException();
    }

    return this.commentsService.create({
      data: { user: { connect: { id: userId } }, item: { connect: { id: itemId } } },
      body: data.body,
      include: { user: true, item: true },
    });
  }
}
