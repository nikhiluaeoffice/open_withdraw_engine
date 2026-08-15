import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema';
import { Merchant, MerchantDocument } from './schemas/merchant.schema';

export interface CreateApiKeyDto {
  merchantEmail?: string;
  name: string;
  environment?: 'testnet' | 'mainnet';
  permissions?: string[];
}

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKeyDocument>,
    @InjectModel(Merchant.name) private readonly merchantModel: Model<MerchantDocument>,
  ) {}

  /**
   * Find or create default merchant by email (for onboarding/dashboard)
   */
  async getOrCreateMerchant(email = 'developer@platform.local', name = 'Default Developer'): Promise<MerchantDocument> {
    let merchant = await this.merchantModel.findOne({ email });
    if (!merchant) {
      merchant = await this.merchantModel.create({ email, name, status: 'active' });
    }
    return merchant;
  }

  /**
   * Generate a new API Secret Key & Public Key ID for a merchant
   */
  async createApiKey(dto: CreateApiKeyDto) {
    const merchant = await this.getOrCreateMerchant(dto.merchantEmail);
    const env = dto.environment || 'testnet';
    
    const randomBuffer = crypto.randomBytes(24).toString('hex');
    const publicBuffer = crypto.randomBytes(8).toString('hex');

    const prefix = env === 'mainnet' ? 'live' : 'test';
    const keyId = `pk_${prefix}_${publicBuffer}`;
    const secretKey = `sk_${prefix}_${randomBuffer}`;

    const secretHash = crypto.createHash('sha256').update(secretKey).digest('hex');

    const apiKey = await this.apiKeyModel.create({
      keyId,
      secretHash,
      merchantId: merchant._id as Types.ObjectId,
      name: dto.name,
      environment: env,
      permissions: dto.permissions || ['withdraw:read', 'withdraw:write'],
      isActive: true,
    });

    return {
      success: true,
      message: 'API Key generated successfully. Save your secret key now—it will not be shown again!',
      apiKey: {
        id: (apiKey._id as Types.ObjectId).toString(),
        keyId: apiKey.keyId,
        secretKey, // Displayed ONLY ONCE
        name: apiKey.name,
        environment: apiKey.environment,
        permissions: apiKey.permissions,
        createdAt: (apiKey as any).createdAt,
      },
    };
  }

  /**
   * List all API Keys for a merchant (omits secret key hash)
   */
  async listApiKeys(merchantEmail = 'developer@platform.local') {
    const merchant = await this.getOrCreateMerchant(merchantEmail);
    const keys = await this.apiKeyModel
      .find({ merchantId: merchant._id as Types.ObjectId })
      .select('-secretHash')
      .sort({ createdAt: -1 });

    return {
      success: true,
      keys: keys.map((k) => ({
        id: (k._id as Types.ObjectId).toString(),
        keyId: k.keyId,
        name: k.name,
        environment: k.environment,
        permissions: k.permissions,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt,
        createdAt: (k as any).createdAt,
      })),
    };
  }

  /**
   * Revoke an API Key by keyId or Object ID
   */
  async revokeApiKey(keyId: string) {
    const key = await this.apiKeyModel.findOne({
      $or: [{ keyId }, { _id: Types.ObjectId.isValid(keyId) ? new Types.ObjectId(keyId) : null }],
    });

    if (!key) {
      throw new NotFoundException('API Key not found');
    }

    key.isActive = false;
    await key.save();

    return {
      success: true,
      message: `API Key ${key.keyId} has been revoked successfully.`,
    };
  }
}
