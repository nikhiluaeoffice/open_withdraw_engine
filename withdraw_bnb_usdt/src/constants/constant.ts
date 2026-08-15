import * as dotenv from 'dotenv';
dotenv.config();

export const rpc = {
    BNBCOIN: process.env.RPC_URL || (process.env.ENVIRONMENT === 'MAINNET' ? 'https://bsc-dataseed.binance.org/' : 'https://data-seed-prebsc-1-s1.binance.org:8545/'),
}

export const network_Details = {
    BNB_CHAIN_ID: process.env.ENVIRONMENT === 'MAINNET' ? 56 : 97,
}

export const Admin_wallet_data = {
    ADMIN_BNB_WALLET_ADDRESS: '0x8D8133cc0bD309AE7984a3030f486c336767acc5',
    ADMIN_BNB_MNEMONIC_PRIVATE_KEY: 'bb2429f512bf52370520224b75200eed5116e11588d865c2b773ff0a3ecedd35',
}
export const networks = {
    BNB: 'BNB'
}



