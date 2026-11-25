# Fabric 测试网络搭建操作手册（套题级教程，参照 docx 实验1）

## 实验目标
用官方 test-network 脚本启动 Fabric 2.5 测试网（2 Org + Orderer + CA），创建通道 mychannel，部署 asset-transfer-basic 链码，用 peer CLI 完成一次写入（Invoke）和一次查询（Query）。产出简历"Fabric 网络搭建"证据。

## 环境状态（2026-09-01 已确认，全部就绪）
- 虚拟机：Ubuntu 24.04（VMware，IP 192.168.177.128，账号 zxy）
- Docker 29.7.2 已装，Fabric 2.5.15 镜像全部拉好（peer/orderer/ccenv/tools/ca/couchdb）
- fabric-samples 在 /home/zxy/hyperledger/fabric-samples（含 test-network + asset-transfer-basic）
- Go 1.22.2 已装（deployCC 需要，已配 GOPROXY=https://goproxy.cn 写入 ~/.bashrc）
- 共享文件夹已修复：/mnt/hgfs/gongxiang <-> E:\XZ\学校课程\DApp学习\gongxiang（双向读写可用）
- 注意：磁盘只剩 1.6G（97%），若步骤报空间不足，先跑 docker system prune -f 清理

## 开始之前
在虚拟机里打开终端（或 SSH：ssh zxy@192.168.177.128），进入 test-network 目录：
cd ~/hyperledger/fabric-samples/test-network

## 第 1 步 清理残留 + 启动网络 + 创建通道
如果之前跑过网络，先清空（当前网络还在运行，从这步开始会先停掉重建）：
./network.sh down

启动网络并创建通道（-ca 表示用 CA 签发证书）：
./network.sh up createChannel -c mychannel -ca

预期输出末尾（关键成功标志）：
- Creating orderer.example.com ... done
- Creating peer0.org2.example.com ... done
- Creating peer0.org1.example.com ... done
- Channel 'mychannel' joined
- Anchor peer set for org 'Org1MSP' on channel 'mychannel'
- Anchor peer set for org 'Org2MSP' on channel 'mychannel'

【截图点 1】上面命令完整输出的最后 15 行（含 Channel joined 字样）。
【截图点 2】docker ps 输出（7 个容器：cli、peer0.org1、peer0.org2、orderer、ca_org1、ca_org2、ca_orderer）：
docker ps

## 第 2 步 部署链码（asset-transfer-basic，Go 版）
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go

预期输出（关键成功标志）：
- Chaincode definition approved on peer0.org1... / peer0.org2...
- Committed chaincode definition for chaincode 'basic' on channel 'mychannel'

如果报 go 未找到：已装好，重开终端即可（GOPROXY 已写入 .bashrc）。
如果卡在拉取依赖：网络问题，先确认 GOPROXY 生效（go env GOPROXY 应显示 goproxy.cn）。

【截图点 3】deployCC 输出末尾（含 Committed chaincode definition 字样）。

## 第 3 步 用 peer CLI 与网络交互（写 + 读）
添加 peer 二进制和配置到环境（每次新终端都要执行）：
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/

设置 Org1 身份环境变量：
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

3.1 写入：调用 InitLedger 初始化 6 个资产（此命令很长，整行复制）：
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'

预期输出：Chaincode invoke successful. result: status:200

【截图点 4】invoke 成功输出。

3.2 查询：获取全部资产：
peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'

预期输出：JSON 数组 asset1~asset6（Tomoko/Brad/Jin Soo/Max/Adriana/Michel）。

【截图点 5】query 输出（asset1~asset6 列表）。

3.3 写入：把 asset6 转给 Christopher：
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"function":"TransferAsset","Args":["asset6","Christopher"]}'

预期输出：Chaincode invoke successful. result: status:200

【截图点 6】TransferAsset 成功输出。

3.4 换 Org2 身份查询 asset6（证明数据跨节点同步）：
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer chaincode query -C mychannel -n basic -c '{"Args":["ReadAsset","asset6"]}'

预期输出：{"ID":"asset6","color":"white","size":15,"owner":"Christopher","appraisedValue":800}（owner 已是 Christopher，证明 Org1 的写入在 Org2 节点可见）

【截图点 7】Org2 查询 asset6，owner=Christopher。

## 第 4 步 关停网络（实验结束）
./network.sh down
预期：停止并删除容器、删除加密材料、移除链码镜像。

【截图点 8】（可选）down 完成后的输出。

## 证据整理（简历"Fabric 网络搭建"）
把 7 个截图存到：E:\XZ\计算机二级Java考试\证据\Fabric\截图\
日志（如果自己跑时 tee 了）也放同目录。
简历一句话：用官方 test-network 搭建 Hyperledger Fabric 2.5 测试网（2 Org + Raft Orderer + CA），创建通道、部署 Go 链码，Invoke/Query 验证资产创建与转移（status:200）。

## 常见坑
1. 磁盘 97%：报 no space 时 docker system prune -f
2. deployCC 报 go 未找到：重开终端（PATH 刷新）
3. invoke 报 chaincode not found：等 3 秒重试（背书传播延迟），network.sh 自带 MAX_RETRY=5
4. 新终端忘记 export：peer 命令会报错，把第 3 步开头 7 行 export 复制进终端
5. 命令太长复制粘贴时注意单引号别丢（-c '{"Args":...}' 整体是单引号包裹）
