import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CryptoWithdrawService } from './crypto_withdraw.service';
import { CryptoWithdrawController } from './crypto_withdraw.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { DeveloperApiController } from './developer-api.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { ApiKey, ApiKeySchema } from './schemas/api-key.schema';
import { Merchant, MerchantSchema } from './schemas/merchant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: Merchant.name, schema: MerchantSchema },
    ]),
  ],
  providers: [CryptoWithdrawService, ApiKeyService, ApiKeyGuard],
  controllers: [CryptoWithdrawController, ApiKeyController, DeveloperApiController],
  exports: [CryptoWithdrawService, ApiKeyService],
})
export class CryptoWithdrawModule {}
