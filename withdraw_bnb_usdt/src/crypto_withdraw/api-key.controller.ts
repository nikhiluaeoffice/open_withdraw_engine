import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';

export class GenerateApiKeyDto {
  @ApiProperty({
    description: 'Identifier or descriptive label for this API Secret Key',
    example: 'Production Backend Server',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Developer or merchant email address',
    example: 'developer@platform.local',
    default: 'developer@platform.local',
  })
  merchantEmail?: string;

  @ApiPropertyOptional({
    description: 'Target network environment: testnet (ChainId: 97) or mainnet (ChainId: 56)',
    example: 'testnet',
    enum: ['testnet', 'mainnet'],
    default: 'testnet',
  })
  environment?: 'testnet' | 'mainnet';

  @ApiPropertyOptional({
    description: 'Permissions granted to this secret key',
    example: ['withdraw:read', 'withdraw:write'],
    default: ['withdraw:read', 'withdraw:write'],
    type: [String],
  })
  permissions?: string[];
}

@ApiTags('Developer API Keys')
@Controller('api/v1/keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new API Secret Key for developer integration' })
  @ApiBody({ type: GenerateApiKeyDto })
  @ApiResponse({ status: 201, description: 'API Key generated successfully. Save secret key immediately.' })
  async generateKey(@Body() body: GenerateApiKeyDto) {
    try {
      return await this.apiKeyService.createApiKey(body);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @Get()
  @ApiOperation({ summary: 'List all API Keys for a developer/merchant' })
  @ApiQuery({ name: 'email', required: false, description: 'Developer email' })
  async listKeys(@Query('email') email?: string) {
    try {
      return await this.apiKeyService.listApiKeys(email);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API Secret Key by ID or keyId' })
  async revokeKey(@Param('id') id: string) {
    try {
      return await this.apiKeyService.revokeApiKey(id);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
