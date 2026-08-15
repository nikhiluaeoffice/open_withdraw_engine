import { Test, TestingModule } from '@nestjs/testing';
import { CryptoWithdrawController } from './crypto_withdraw.controller';
import { CryptoWithdrawService } from './crypto_withdraw.service';

describe('CryptoWithdrawController', () => {
  let controller: CryptoWithdrawController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CryptoWithdrawController],
      providers: [CryptoWithdrawService],
    }).compile();

    controller = module.get<CryptoWithdrawController>(CryptoWithdrawController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
