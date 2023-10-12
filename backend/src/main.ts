import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { Logger } from './logger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) || 3001 : 3001;
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(),
  });
  app.use(cookieParser());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.enableCors({ credentials: true, origin: process.env.CORS_ORIGIN });
  await app.listen(port);
}
bootstrap();
