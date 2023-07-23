import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, Metadata } from '@azure/storage-blob';

@Injectable()
export class AzblobService {
  private logger = new Logger(AzblobService.name);
  private blobClient: BlobServiceClient;

  constructor(private readonly configService: ConfigService) {
    this.logger.log('Initializing Azure Blob Service...');

    // Initialize blob client
    this.blobClient = BlobServiceClient.fromConnectionString(
      this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING') || '',
    );
  }

  init(containerName: string) {
    const containerClient = this.blobClient.getContainerClient(containerName);
    return containerClient.createIfNotExists();
  }

  downloadBlob(containerName: string, blobName: string) {
    const containerClient = this.blobClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.download();
  }

  downloadBlobToBuffer(containerName: string, blobName: string) {
    const containerClient = this.blobClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.downloadToBuffer();
  }

  uploadBlob(
    containerName: string,
    blobName: string,
    contentType: string,
    body: string | Buffer,
    metadata?: Metadata,
  ) {
    const containerClient = this.blobClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.upload(body, body.length, {
      blobHTTPHeaders: { blobContentType: contentType },
      metadata,
    });
  }

  deleteBlob(containerName: string, blobName: string) {
    const containerClient = this.blobClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.deleteIfExists();
  }

  deleteBlobDirectory(containerName: string, dirName: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const containerClient = this.blobClient.getContainerClient(containerName);
        const iterator = containerClient.listBlobsFlat({ prefix: dirName }).byPage();
        const response = (await iterator.next()).value;
        let cnt = 0;
        for (const blob of response.segment.blobItems) {
          await this.deleteBlob(containerName, blob.name);
          cnt++;
        }
        resolve(cnt);
      } catch (err) {
        reject(err);
      }
    });
  }
}
