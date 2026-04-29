# FlowCash iOS 构建与安装指南（无 Mac 方案）

---

## 一、GitHub Actions 自动编译（已完成）

项目已集成 GitHub Actions。你每次推送代码到 `main` 或 `master` 分支，或者手动点击 **Actions → Build iOS IPA → Run workflow**，GitHub 的免费 macOS 云服务器就会自动帮你编译出 `.ipa` 文件。

---

## 二、你需要做的事

### 第 1 步：把项目传到 GitHub

在你的 Windows 电脑上：

```bash
# 1. 进入项目目录
cd flowcash

# 2. 初始化 Git（如果还没做）
git init

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "init"

# 5. 在 GitHub 新建一个仓库（不勾选 README），复制仓库地址
# 例如：https://github.com/你的用户名/flowcash.git

# 6. 关联并推送
git remote add origin https://github.com/你的用户名/flowcash.git
git branch -M main
git push -u origin main
```

推送成功后，去 GitHub 页面，点上方 **Actions** 标签，应该能看到 workflow 正在运行（黄色点表示进行中，绿色勾表示成功）。

### 第 2 步：下载编译好的 IPA

1. 等 workflow 跑完（约 5-8 分钟）
2. 进入 GitHub 仓库 → **Actions** → 最新的成功运行记录
3. 页面底部找到 **Artifacts** 区域
4. 点击 **FlowCash-unsigned** 下载 zip
5. 解压得到 `FlowCash.ipa`

> 你也可以在 Actions 页面直接点击右侧 "Run workflow" 按钮手动触发编译，无需推送代码。

---

## 三、Windows 上签名安装到 iPhone

下载 **Sideloadly**（免费）：https://sideloadly.io/

### 安装步骤：

1. **连接 iPhone**：用数据线把 iPhone 连到电脑
2. **打开 Sideloadly**
3. 把下载好的 `FlowCash.ipa` 拖进 Sideloadly 窗口
4. **Device** 下拉框选择你的 iPhone
5. **Apple Account** 填你的 Apple ID（普通账号即可，无需付费开发者）
6. 点击 **Start**，输入 Apple ID 密码
7. 如果提示双重认证，在手机上点允许，把 6 位验证码填给 Sideloadly
8. 等待完成，App 会出现在手机桌面上

### 首次打开 App：

iPhone 会提示"不受信任的开发者"，去：

**设置 → 通用 → VPN 与设备管理** → 找到你的 Apple ID → 点击 **信任**

然后就能正常打开 FlowCash 了。

---

## 四、每 7 天续签

免费 Apple ID 签名的 App 有效期只有 7 天，到期后无法打开。

**续签方法**：

- **最简单**：7 天后重新用 Sideloadly 安装一遍（数据不会丢失，因为数据存在 App 自己的 localStorage 里）
- **更省事**：在 iPhone 上也装 **AltStore**，设置好自动续签（WiFi 续签，不用连电脑）

AltStore 官网：https://altstore.io/

---

## 五、后续修改代码后重新编译

每次你改完代码，只需要：

```bash
git add .
git commit -m "update"
git push origin main
```

GitHub Actions 会自动重新编译，你去 Actions 页面下载新的 IPA 即可。

---

## 六、常见问题

**Q: GitHub Actions 编译失败怎么办？**
A: 点击失败的运行记录，展开日志查看错误。通常是 package.json 或 iOS 工程问题，可以把日志贴给我。

**Q: Sideloadly 提示 "Your Apple ID has reached the app limit"？**
A: 免费 Apple ID 有同时安装 3 个自签 App 的限制，删掉一些旧的再试。

**Q: 能上架 App Store 吗？**
A: 这个方案编译的是 Development 版本，不能直传 App Store。如果想上架，需要注册 Apple Developer Program（¥688/年），然后用 Xcode 或 Transporter 上传。
