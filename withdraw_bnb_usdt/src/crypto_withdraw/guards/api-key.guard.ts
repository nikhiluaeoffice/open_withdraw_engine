import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyDocument } from '../schemas/api-key.schema';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract key from 'x-api-key' or 'Authorization: Bearer <key>' header
    let rawKey = request.headers['x-api-key'] as string;
    if (!rawKey && request.headers.authorization) {
      const authHeader = request.headers.authorization as string;
      if (authHeader.startsWith('Bearer ')) {
        rawKey = authHeader.substring(7).trim();
      }
    }

    if (!rawKey) {
      throw new UnauthorizedException(
        'Missing API Secret Key. Provide header "x-api-key" or "Authorization: Bearer <secret_key>".',
      );
    }

    // Hash raw key using SHA-256
    const secretHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // Look up key in MongoDB
    const apiKeyDoc = await this.apiKeyModel.findOne({
      secretHash,
      isActive: true,
    }).select('+secretHash');

    if (!apiKeyDoc) {
      throw new UnauthorizedException('Invalid or revoked API Secret Key.');
    }

    // Update lastUsedAt asynchronously
    this.apiKeyModel.updateOne({ _id: apiKeyDoc._id }, { lastUsedAt: new Date() }).exec().catch(() => {});

    // Attach merchant and key details to request context
    request.apiKey = apiKeyDoc;
    request.merchantId = apiKeyDoc.merchantId;
    request.environment = apiKeyDoc.environment;

    return true;
  }
}
