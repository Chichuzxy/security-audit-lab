# -*- coding: utf-8 -*-
"""
query_chain.py - 用 requests 调 Ethereum JSON-RPC 查链上数据
用途: 简历"掌握Python"证据 - Python 脚本查链上数据
用法: python query_chain.py [地址]
  不带地址时查询示例地址(V神)余额; 也可传自己的地址, 例如:
  python query_chain.py 0x你的地址
输出: 最新区块高度/详情/gas价格/指定地址ETH余额
"""
import json
import sys
import time
import requests

RPC_URL = "https://ethereum.publicnode.com"  # 公共 RPC, 免key
DEMO_ADDR = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"  # vitalik.eth, 仅演示用


def rpc(method, params):
    """发一次 JSON-RPC 请求并返回 result"""
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    resp = requests.post(RPC_URL, json=payload, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"RPC error: {data['error']}")
    return data["result"]


def wei_to_eth(wei_hex):
    """0x 开头的 wei 十六进制转 ETH 数值(保留4位小数)"""
    wei = int(wei_hex, 16)
    return wei / 10**18


def main():
    addr = sys.argv[1] if len(sys.argv) > 1 else DEMO_ADDR

    print("=" * 50)
    print("RPC:", RPC_URL)
    print("时间:", time.strftime("%Y-%m-%d %H:%M:%S"))

    # 1. 最新区块高度
    latest = int(rpc("eth_blockNumber", []), 16)
    print(f"\n[1] 最新区块高度: {latest}")

    # 2. 最新区块详情
    block = rpc("eth_getBlockByNumber", ["latest", False])
    print(f"[2] 最新区块哈希: {block['hash']}")
    print(f"    区块内交易数: {len(block['transactions'])}")
    print(f"    gas 用量: {int(block['gasUsed'], 16)} / 上限 {int(block['gasLimit'], 16)}")

    # 3. 当前 gas 价格
    gas = int(rpc("eth_gasPrice", []), 16) / 10**9
    print(f"[3] 当前 gas 价格: {gas:.2f} Gwei")

    # 4. 指定地址余额
    balance = rpc("eth_getBalance", [addr, "latest"])
    print(f"[4] 地址 {addr}")
    print(f"    ETH 余额: {wei_to_eth(balance):.6f} ETH")

    print("=" * 50)


if __name__ == "__main__":
    main()
