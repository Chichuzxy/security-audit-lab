# 智能合约审计报告（示范样例）

- 日期：2026-08-21（预跑示范，8/24 侦探日可对照重做）
- 审计对象：FlashSwap.sol、MockERC20.sol（hardhat 学习项目）
- 工具：Slither 0.11.6 + solc 0.8.20，人工审查补充
- 结论：共发现 6 个问题（High 1 / Medium 1 / Low 2 / Info 2）

==============================
发现 1：【High】MockERC20.mint 无权限控制（人工审查发现）
==============================
- 位置：MockERC20.sol 第 18-20 行
- 描述：mint(address,uint256) 是 public，任何地址都能调用铸币，没有 onlyOwner/访问控制。
  代码注释写着"只有合约部署者可以调用"，但实现里没有做权限检查。
- 影响：任何人可以无限铸造代币，代币总量失去意义，价格归零。属于访问控制漏洞。
- 修复：加权限控制。继承 Ownable 或加 modifier：
  function mint(address to, uint256 amount) public onlyOwner {
      _mint(to, amount);
  }
- 验证：修复后重跑 Slither，人工确认 mint 前有权限检查（Slither 默认检测器不报此类问题，
  需要人工审查发现——这正是"工具+人工"结合的价值）。

==============================
发现 2：【Medium】FlashSwap 还款 transfer 未检查返回值（Slither: unchecked-transfer）
==============================
- 位置：FlashSwap.sol 第 85 行
- 描述：IERC20(tokenBorrow).transfer(pair, amountToRepay) 忽略返回值。
  ERC20 transfer 失败时返回 false（而不是 revert），合约不检查就继续执行。
- 影响：如果代币 transfer 静默失败，合约以为已还款，实际没还——闪电贷可被免费借走资金。
- 修复：用 SafeERC20 的 safeTransfer，或检查返回值：
  require(IERC20(tokenBorrow).transfer(pair, amountToRepay), "transfer failed");
- 验证：重跑 Slither，unchecked-transfer 告警消失。

==============================
发现 3：【Low】FlashSwap 构造函数地址缺零检查（Slither: missing-zero-check）
==============================
- 位置：FlashSwap.sol 第 43-46 行
- 描述：WETH 和 UniswapV2Factory 参数没有 require(_weth != address(0)) 检查。
- 影响：传错 0 地址时合约部署成功但无法使用，浪费部署费用。
- 修复：
  require(_weth != address(0), "zero weth");
  require(_factory != address(0), "zero factory");
- 验证：重跑 Slither，missing-zero-check 消失。

==============================
发现 4：【Low】MockERC20 构造函数参数遮蔽父类（Slither: shadowing-local）
==============================
- 位置：MockERC20.sol 第 9 行
- 描述：构造函数参数 name/symbol 与 ERC20.name()/symbol() 函数同名。
- 影响：易混淆，代码可读性差；潜在误用风险。
- 修复：参数改名，如 name_ / symbol_。
- 验证：重跑 Slither，shadowing-local 消失。

==============================
发现 5：【Info】编译器版本过旧/不统一（Slither: solc-version + pragma）
==============================
- 位置：两合约 pragma 声明 + OZ 依赖版本
- 描述：^0.8.20 存在已知编译问题；依赖 OZ 内部跨 >=0.4.16 到 ^0.8.20 多个版本。
- 影响：潜在编译器级 bug 风险（如 VerbatimInvalidDeduplication）。
- 修复：统一升到 0.8.24+，并固定 OZ 版本。
- 验证：重跑 Slither，版本类告警消失。

==============================
发现 6：【Info】命名不规范（Slither: naming-convention）
==============================
- 位置：FlashSwap.sol WETH/UniswapV2Factory 变量、_tokenBorrow 等参数
- 描述：变量未按 mixedCase 命名规范。
- 影响：代码风格问题，不影响安全。
- 修复：WETH -> weth，UniswapV2Factory -> uniswapV2Factory。
- 验证：重跑 Slither，naming-convention 消失。

==============================
审计过程记录
==============================
- 扫描命令（Windows 实操）：
  slither contracts/FlashSwap.sol --solc <solc路径> --solc-remaps "@openzeppelin/=node_modules/@openzeppelin/"
- 原始输出：slither_FlashSwap_原始报告.txt、slither_MockERC20_原始报告.txt
- 工具局限记录：Slither 默认 102 个检测器未报 mint 权限问题（发现 1），
  靠人工审查代码发现——体现"工具筛选 + 人工确认"的完整审计流程。
- 注意：MockERC20 扫描时 pragma 临时改为 ^0.8.20（本机 solc 0.8.24 下载被墙），
  仅影响编译环境，不影响漏洞结论。
- 修复验证（发现 2）：已生成 FlashSwap_Fixed.sol（transfer 包 require），
  重跑 Slither 后 unchecked-transfer 告警消失（12 -> 11 条），证明修复有效。
