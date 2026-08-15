import { Test, TestingModule } from '@nestjs/testing';
import { CryptoWithdrawService } from './crypto_withdraw.service';

describe('CryptoWithdrawService', () => {
  let service: CryptoWithdrawService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoWithdrawService],
    }).compile();

    service = module.get<CryptoWithdrawService>(CryptoWithdrawService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
