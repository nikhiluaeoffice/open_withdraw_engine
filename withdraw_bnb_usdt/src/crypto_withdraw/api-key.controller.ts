import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';

export class GenerateApiKeyDto {
  name: string;
  merchantEmail?: string;
  environment?: 'testnet' | 'mainnet';
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
