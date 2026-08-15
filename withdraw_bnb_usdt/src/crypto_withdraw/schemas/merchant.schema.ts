import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MerchantDocument = Merchant & Document;

@Schema({ timestamps: true })
export class Merchant {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ default: null, trim: true })
  webhookUrl?: string;

  @Prop({ default: null, select: false })
  webhookSecret?: string;

  @Prop({ required: true, enum: ['active', 'suspended'], default: 'active' })
  status: string;
}

export const MerchantSchema = SchemaFactory.createForClass(Merchant);
