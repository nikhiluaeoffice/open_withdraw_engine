import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordTransactionDto {
  @ApiProperty({
    description: 'Transaction Hash (0x...)',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  txHash: string;

  @ApiProperty({
    description: 'Sender wallet address',
    example: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2',
  })
  senderAddress: string;

  @ApiProperty({
    description: 'Recipient wallet address or summary',
    example: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
  })
  recipientAddress: string;

  @ApiProperty({
    description: 'Transfer amount',
    example: 0.005,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'Token symbol (default: BNB)',
    example: 'BNB',
    default: 'BNB',
  })
  tokenSymbol?: string;

  @ApiPropertyOptional({
    description: 'Token smart contract address',
    example: '0x38cB7800C3Fddb8dda074C1c650A155154924C73',
  })
  tokenAddress?: string;

  @ApiPropertyOptional({
    description: 'Blockchain chain ID',
    example: 97,
    default: 97,
  })
  chainId?: number;

  @ApiPropertyOptional({
    description: 'Transaction type: single | batch | token | approve',
    example: 'single',
    default: 'single',
  })
  txType?: string;

  @ApiPropertyOptional({
    description: 'Status: pending | success | failed',
    example: 'success',
    default: 'pending',
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Optional failure message',
    example: 'Reverted on-chain',
  })
  errorMessage?: string;
}

export class PatchTransactionDto {
  @ApiProperty({
    description: 'Transaction Hash (0x...)',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  txHash: string;

  @ApiProperty({
    description: 'Status: pending | success | failed',
    example: 'success',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Optional error message if failed',
  })
  errorMessage?: string;
}

export class NativeTransferDto {
  @ApiProperty({
    description: 'Recipient wallet address',
    example: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2',
  })
  receiver: string;

  @ApiProperty({
    description: 'Amount in BNB (native coin)',
    example: 0.001,
  })
  amount: number;
}


export class TokenTransferDto {
  @ApiProperty({
    description: 'Recipient wallet address',
    example: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2',
  })
  receiver: string;

  @ApiProperty({
    description: 'Amount of tokens to transfer (human readable e.g., 10 for 10 USDT)',
    example: 10,
  })
  amount: number;

  @ApiProperty({
    description: 'Token contract address (BEP20 / ERC20)',
    example: '0x38cB7800C3Fddb8dda074C1c650A155154924C73',
  })
  tokenAddress: string;

  @ApiPropertyOptional({
    description: 'Token decimals (default: 18)',
    example: 18,
    default: 18,
  })
  tokenDecimals?: number;
}

export class BatchTransferTokenDto {
  @ApiProperty({
    description: 'BEP20 / ERC20 Token contract address',
    example: '0x38cB7800C3Fddb8dda074C1c650A155154924C73',
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'Array of recipient wallet addresses',
    example: [
      '0x617F2E2fD72FD9D5503197092aC168c91465E7f2',
      '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
    ],
  })
  recipients: string[];

  @ApiProperty({
    description: 'Array of amounts to send to each recipient (human readable format)',
    example: [10, 20],
  })
  amounts: (string | number)[];

  @ApiPropertyOptional({
    description: 'Token decimals (default: 18)',
    example: 18,
    default: 18,
  })
  tokenDecimals?: number;

  @ApiPropertyOptional({
    description: 'Network symbol identifier (default: BNB)',
    example: 'BNB',
    default: 'BNB',
  })
  networkSymbol?: string;
}

export class BatchTransferRecipientDto {
  @ApiProperty({
    description: 'Token contract address (0x0000000000000000000000000000000000000000 for native BNB)',
    example: '0x0000000000000000000000000000000000000000',
  })
  token: string;

  @ApiProperty({
    description: 'Recipient wallet address',
    example: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2',
  })
  address: string;

  @ApiProperty({
    description: 'Amount to transfer',
    example: '0.001',
  })
  amount: string | number;
}

export class LegacyRecipientsDataDto {
  @ApiPropertyOptional({ type: [BatchTransferRecipientDto] })
  recipients?: BatchTransferRecipientDto[];
}

export class LegacyTransactionsDto {
  @ApiPropertyOptional({ type: LegacyRecipientsDataDto })
  recipientsData?: LegacyRecipientsDataDto;
}

export class BatchTransferDto {
  @ApiPropertyOptional({
    description: 'Token contract address if single token batch transfer is used',
    example: '0x38cB7800C3Fddb8dda074C1c650A155154924C73',
  })
  tokenAddress?: string;

  @ApiPropertyOptional({
    description: 'Array of token contract addresses (use 0x0000000000000000000000000000000000000000 for native coin)',
    example: [
      '0x0000000000000000000000000000000000000000',
      '0x38cB7800C3Fddb8dda074C1c650A155154924C73',
    ],
  })
  tokens?: string[];

  @ApiPropertyOptional({
    description: 'Grouped array of recipient addresses for each token',
    example: [
      ['0x617F2E2fD72FD9D5503197092aC168c91465E7f2', '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB'],
      ['0x617F2E2fD72FD9D5503197092aC168c91465E7f2'],
    ],
  })
  receivers?: string[][];

  @ApiPropertyOptional({
    description: 'Grouped array of raw amounts for each recipient per token',
    example: [
      ['0.001', '0.002'],
      ['10'],
    ],
  })
  amounts?: any;

  @ApiPropertyOptional({
    description: 'Single token decimals or array of decimals',
    example: 18,
  })
  tokenDecimals?: number;

  @ApiPropertyOptional({
    description: 'Token decimals array matching the tokens array',
    example: [18, 18],
  })
  decimals?: number[];

  @ApiPropertyOptional({
    description: 'Network symbol identifier (default: BNB)',
    example: 'BNB',
    default: 'BNB',
  })
  networkSymbol?: string;

  @ApiPropertyOptional({
    description: 'Legacy nested transactions format for backward compatibility',
    type: LegacyTransactionsDto,
  })
  transactions?: LegacyTransactionsDto;
}
