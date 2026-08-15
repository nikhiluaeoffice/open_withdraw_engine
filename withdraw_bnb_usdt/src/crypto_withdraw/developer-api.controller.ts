import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CryptoWithdrawService } from './crypto_withdraw.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { NativeTransferDto, TokenTransferDto, BatchTransferTokenDto } from './dto/crypto_withdraw.dto';

@ApiTags('Developer SDK & API (v1)')
@ApiHeader({
  name: 'x-api-key',
  description: 'Developer Secret Key (e.g. sk_test_... or sk_live_...)',
  required: true,
})
@UseGuards(ApiKeyGuard)
@Controller('api/v1')
export class DeveloperApiController {
  constructor(private readonly cryptoWithdrawService: CryptoWithdrawService) {}

  @Post('withdrawals/native')
  @ApiOperation({ summary: 'SDK/API: Initiate native BNB transfer' })
  @ApiBody({ type: NativeTransferDto })
  async transferNative(@Req() req: any, @Body() body: NativeTransferDto) {
    try {
      const receipt = await this.cryptoWithdrawService.transfer(
        body.receiver,
        body.amount,
        { merchantId: req.merchantId, apiKeyId: req.apiKey._id }
      );
      return {
        success: true,
        environment: req.environment,
        transactionHash: receipt.transactionHash,
        status: receipt.status ? 'success' : 'failed',
        receipt,
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @Post('withdrawals/token')
  @ApiOperation({ summary: 'SDK/API: Initiate ERC20/BEP20 token transfer' })
  @ApiBody({ type: TokenTransferDto })
  async transferToken(@Req() req: any, @Body() body: TokenTransferDto) {
    try {
      const receipt = await this.cryptoWithdrawService.transferToken(
        body.receiver,
        body.amount,
        body.tokenAddress,
        body.tokenDecimals || 18,
        { merchantId: req.merchantId, apiKeyId: req.apiKey._id }
      );
      return {
        success: true,
        environment: req.environment,
        transactionHash: receipt.transactionHash,
        status: receipt.status ? 'success' : 'failed',
        receipt,
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @Get('transactions')
  @ApiOperation({ summary: 'SDK/API: Retrieve merchant transaction history ledger' })
  @ApiQuery({ name: 'sender', required: false })
  async getTransactions(@Req() req: any, @Query('sender') sender?: string) {
    try {
      const list = await this.cryptoWithdrawService.getTransactions(sender, 100, req.merchantId);
      const formatted = list.map((tx: any) => ({
        id: tx._id.toString(),
        txHash: tx.txHash,
        senderAddress: tx.senderAddress,
        recipientAddress: tx.recipientAddress,
        amount: tx.amount,
        tokenSymbol: tx.tokenSymbol,
        tokenAddress: tx.tokenAddress,
        chainId: tx.chainId,
        txType: tx.txType,
        status: tx.status,
        errorMessage: tx.errorMessage,
        createdAt: tx.createdAt,
      }));
      return { success: true, count: formatted.length, transactions: formatted };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'SDK/API: Retrieve merchant transaction aggregate metrics' })
  async getStats(@Req() req: any, @Query('sender') sender?: string) {
    try {
      const stats = await this.cryptoWithdrawService.getStats(sender, req.merchantId);
      return { success: true, stats };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
