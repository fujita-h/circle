import * as fs from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { DeleteByQueryRequest, SearchRequest } from '@elastic/elasticsearch/lib/api/types';

@Injectable()
export class EsService {
  private logger = new Logger(EsService.name);
  private client: Client;

  constructor(private readonly configService: ConfigService) {
    this.logger.log('Initializing Es Service...');

    // Initialize Elasticsearch Client
    this.client = new Client({
      node: this.configService.get<string>('ES_ENDPOINT') || 'https://127.0.0.1:9200',
      auth: {
        username: this.configService.get<string>('ES_USERNAME') || 'elastic',
        password: this.configService.get<string>('ES_PASSWORD') || 'elastic',
      },
      tls: {
        ca: this.configService.get<string>('ES_CA_FILE')
          ? fs.readFileSync(this.configService.get<string>('ES_CA_FILE') || '')
          : undefined,
        rejectUnauthorized: true,
      },
    });
  }

  init(index: string) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const exists = await this.client.indices.exists({ index });
        if (!exists) {
          const body = JSON.parse(fs.readFileSync('resources/elasticsearch/base.json', 'utf8'));
          await this.client.indices.create({ index, body }, { ignore: [400] });
        }
        const files = fs.readdirSync('resources/elasticsearch/');
        for (const file of files) {
          if (file.startsWith(`mapping.${index}.`) && file.endsWith('.json')) {
            const body = JSON.parse(fs.readFileSync(`resources/elasticsearch/${file}`, 'utf8'));
            await this.client.indices.putMapping({ index, body: body });
          }
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  create(index: string, id: string, body: any) {
    return this.client.index({ index, id, body });
  }

  search(index: string, body: SearchRequest) {
    return this.client.search({ index, body });
  }

  delete(index: string, id: string) {
    return this.client.delete({ index, id }, { ignore: [404] });
  }

  deleteByQuery(request: DeleteByQueryRequest) {
    return this.client.deleteByQuery(request);
  }
}
