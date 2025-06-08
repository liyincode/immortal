1. 设置 `hardhat.config.ts` 中的 `monadTestnet` 网络配置
   在 networks 中添加 monadTestnet 网络配置
```
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz",
      accounts: [deployerPrivateKey],
      chainId: 10143,
    },
```
修改 etherscan 和 sourcify 的配置
```
  etherscan: {
    enabled: false,
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet.monadexplorer.com",
  },
```
把之前的 etherscan 和 sourcify 的配置注释掉

2. 设置私钥，会自动将加密后的私钥添加到 .env 中
   私钥在 metamask 中，点击账户详情，输入密码就看到了
```
yarn account:import
```

3. 编写合约，在 contracts 目录下编写合约

4. 部署合约
```
yarn deploy --network monadTestnet
```

5. 验证合约
```
yarn hardhat:hardhat-verify  --network monadTestnet 0x...
```
或者是（这个需要进入 packages/hardhat 目录下执行）
```
npx hardhat verify --network monadTestnet 0x...
```
