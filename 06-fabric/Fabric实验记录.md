# Hyperledger Fabric 测试网络实验记录（9/2 实操）

## 机制一句话
用官方 test-network 脚本在 Ubuntu + Docker 上拉起最小联盟链：2 个组织各 1 个 Peer + 1 个 Orderer（Raft）+ 3 个 CA，创建通道 mychannel，Peer 加入后部署 Go 链码 asset-transfer-basic，通过提案-背书-排序-验证流程完成资产写入和查询。类比：一键开店——Peer=店员、Orderer=仓库、CA=HR，通道=项目群。

## 实验环境
- 虚拟机：VMware Ubuntu 24.04（8 vCPU / 8G 内存 / NAT，IP 192.168.177.128）
- Docker 29.7.2，Fabric 2.5.15 镜像（hyperledger/fabric-peer、orderer、ccenv、tools、ca）
- fabric-samples：/home/zxy/hyperledger/fabric-samples（官方 test-network）
- Go 1.22.2（deployCC 编译链码依赖，GOPROXY 配 goproxy.cn 国内镜像）

## 执行步骤与截图对照
| 步骤 | 命令 | 关键成功标志 | 截图 |
|------|------|-------------|------|
| 1. 启动网络+建通道 | ./network.sh up createChannel -c mychannel -ca | Channel 'mychannel' joined | tu/01_network_up_createChannel.png |
| 2. 查看节点容器 | docker ps | 7 容器（cli/peer0.org1/peer0.org2/orderer/ca_org1/ca_org2/ca_orderer） | tu/02_docker_ps_7containers.png |
| 3. 部署链码 | ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go | Committed chaincode definition for chaincode 'basic' | tu/03_deployCC_committed.png |
| 4. 写入：初始化账本 | peer chaincode invoke ... InitLedger | Chaincode invoke successful. result: status:200 | tu/04_invoke_InitLedger.png |
| 5. 查询：全部资产 | peer chaincode query ... GetAllAssets | JSON 数组 asset1~asset6 | tu/05_query_GetAllAssets.png |
| 6. 写入：转移资产 | peer chaincode invoke ... TransferAsset asset6 Christopher | status:200 | tu/06_transfer_asset6.png |
| 7. Org2 节点查询 | 换 Org2MSP 环境变量后 peer chaincode query ... ReadAsset asset6 | owner 已变为 Christopher（跨节点同步证明） | tu/07_org2_query_asset6.png |
| 8. 关停网络 | ./network.sh down | 容器/加密材料/链码镜像清理 | tu/08_network_down.png |

## 验证材料
1. 8 张步骤截图（见上表，tu/ 目录）
2. network.sh up 日志含 Channel 'mychannel' joined + Anchor peer set（Org1MSP/Org2MSP）
3. deployCC 日志含 Committed chaincode definition（链码已激活）
4. InitLedger/TransferAsset 两次 invoke 均 status:200（写路径验证）
5. GetAllAssets 返回 6 个资产、Org2 ReadAsset asset6 返回 owner=Christopher（读路径 + 跨组织数据同步验证）

## 实验要点（面试可讲）
- 交易 5 步：提案 -> 模拟执行（背书，不改账本）-> 收集签名 -> Orderer 排序打包 -> Peer 验证写入
- 为什么 invoke 要 --peerAddresses 指向两个 Org：背书策略要求 Org1+Org2 都签名
- -ca 参数：用 CA 签发证书而非预置 crypto（更接近真实部署）
- 通道隔离：只有加入的组织能看该通道账本（类比：私密群聊）

## 简历使用建议
"用官方 test-network 搭建 Hyperledger Fabric 2.5 测试网络（2 Org + Raft Orderer + CA），创建通道、部署 Go 资产链码，Invoke/Query 完成资产创建、查询、转移验证（status:200），Org1 写入 Org2 可查，证明跨节点账本同步。"
