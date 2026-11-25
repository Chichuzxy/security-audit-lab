// query_contract.ts
// 简历"掌握 TypeScript"证据 - TS + ethers.js 合约交互脚本
// 功能: 连接 Ethereum 公共 RPC, 读取链上最新区块 + 只读调用 ERC20 合约
//       (USDC) 的 view 方法 (name/symbol/decimals/balanceOf), 无需私钥。
// 运行: npx tsx query_contract.ts   (或 npm start)
// 对照: Moss-Buddy backend/tools/query.js (fetch 裸调 RPC -> 本脚本用 ethers.js)

import { ethers } from "ethers";

// 公共 RPC, 免 key (与 Python 查链脚本同源, 方便对照)
const RPC_URL = "https://ethereum.publicnode.com";
// USDC 主网合约地址 (真实合约, 只读调用不需要私钥)
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
// 演示查询的地址 (V神; 可换成自己的地址)
const WATCH_ADDR = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

// ERC20 标准接口的最小 ABI (只声明我们要调用的方法)
const erc20Abi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
];

async function main(): Promise<void> {
  console.log("=".repeat(56));
  console.log("RPC:", RPC_URL);
  console.log("时间:", new Date().toLocaleString("zh-CN", { hour12: false }));

  // 1. Provider = 只读入口, 封装了所有 RPC 请求
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const block = await provider.getBlockNumber();
  console.log(`[1] 最新区块高度: ${block}`);

  // 2. 用 地址 + ABI 创建 Contract 对象 (etherscan 上验证过的标准 ERC20)
  const usdc = new ethers.Contract(USDC_ADDRESS, erc20Abi, provider);
  const name = await usdc.name();
  const symbol = await usdc.symbol();
  const decimals = await usdc.decimals();
  console.log(`[2] 合约 ${USDC_ADDRESS}`);
  console.log(`    名称: ${name} (${symbol}), 精度: ${decimals}`);

  // 3. 只读调用 view 方法 balanceOf 查地址持仓
  const raw = await usdc.balanceOf(WATCH_ADDR);
  const bal = ethers.formatUnits(raw, decimals);
  console.log(`[3] 地址 ${WATCH_ADDR}`);
  console.log(`    ${symbol} 余额: ${bal}`);

  // 4. 原生 ETH 余额对照 (ethers 自带格式化)
  const eth = await provider.getBalance(WATCH_ADDR);
  console.log(`    ETH 余额: ${ethers.formatEther(eth)}`);
  console.log("=".repeat(56));
}

main().catch((err) => {
  console.error("脚本出错:", err);
  process.exit(1);
});
