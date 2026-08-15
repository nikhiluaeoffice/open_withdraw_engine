import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Merchant', index: true, default: null })
  merchantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ApiKey', index: true, default: null })
  apiKeyId?: Types.ObjectId;

  @Prop({ required: true, index: true, trim: true })
  txHash: string;

  @Prop({ required: true, index: true, lowercase: true, trim: true })
  senderAddress: string;

  @Prop({ required: true, trim: true })
  recipientAddress: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ default: 'BNB', trim: true })
  tokenSymbol: string;

  @Prop({ default: null, trim: true })
  tokenAddress?: string;

  @Prop({ required: true, type: Number, default: 97 })
  chainId: number;

  @Prop({ default: 'single', enum: ['single', 'batch', 'token', 'approve'] })
  txType: string;

  @Prop({ default: 'pending', enum: ['pending', 'success', 'failed'] })
  status: string;

  @Prop({ default: null })
  errorMessage?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Compound index for querying user history sorted by date
TransactionSchema.index({ senderAddress: 1, createdAt: -1 });
