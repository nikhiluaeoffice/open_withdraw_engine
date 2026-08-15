import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CryptoWithdrawModule } from './crypto_withdraw/crypto_withdraw.module';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/withdraw_db',
    ),
    CryptoWithdrawModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

