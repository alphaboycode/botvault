import { createPublicClient, http } from 'viem';
import { botMainnet, botTestnet } from './chain';
import addresses from './addresses.json';
import botVaultAbi from './BotVault.json';
import wbotAbi from './WBOT.json';

export { botMainnet, botTestnet, addresses, botVaultAbi, wbotAbi };

export const publicClient = createPublicClient({
  chain: botMainnet,
  transport: http(),
});

export const VAULT_DECIMALS = 24;
export const BOT_DECIMALS = 18;
