import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ required: true, unique: true, index: true, trim: true })
  keyId: string; // e.g. pk_test_xxxx or pk_live_xxxx

  @Prop({ required: true, select: false })
  secretHash: string; // SHA-256 hash of secret key (sk_test_xxxx or sk_live_xxxx)

  @Prop({ required: true, type: Types.ObjectId, ref: 'Merchant', index: true })
  merchantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: ['testnet', 'mainnet'], default: 'testnet', index: true })
  environment: string;

  @Prop({ type: [String], default: ['withdraw:read', 'withdraw:write'] })
  permissions: string[];

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: null })
  lastUsedAt?: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

// Index for key lookup
ApiKeySchema.index({ keyId: 1, isActive: 1 });
