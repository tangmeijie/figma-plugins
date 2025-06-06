# Figma插件开发工程

这是一个用于开发Figma插件的通用工程项目，支持TypeScript和模块化插件管理。

## 项目结构

```
├── plugins/                 # 插件目录
│   └── fill-content-from-json/  # 填充JSON内容插件
│       ├── code.ts          # TypeScript源代码（包含所有功能）
│       ├── code.js          # 编译后的主代码文件 (构建生成)
│       ├── ui.html          # 插件UI界面
│       ├── manifest.json    # 插件配置文件
│       └── tsconfig.json    # TypeScript编译配置
├── package.json            # 项目依赖配置
├── package-lock.json       # 依赖锁定文件
├── .gitignore             # Git忽略规则
└── README.md              # 项目说明
```

## 🚀 快速开始

### 环境要求

1. **安装 Node.js**: https://nodejs.org/ (推荐 LTS 版本)
2. **安装依赖**:
   ```bash
   npm install
   ```

### 首次使用

⚠️ **重要**: 插件使用TypeScript编写，必须先构建才能在Figma中使用！

```bash
# 1. 构建插件
npm run build

# 2. 验证构建结果 - 确保生成了 code.js 文件
ls plugins/fill-content-from-json/code.js
```

构建成功后，您将看到 `plugins/fill-content-from-json/` 目录下生成了 `code.js` 文件。

## 🔧 开发模式

### 构建命令
```bash
# 一次性构建插件
npm run build

# 开发模式（监听文件变化，自动编译）
npm run dev

# 或者使用监听模式
npm run watch
```

### 📝 完整开发工作流

**每次修改代码后的标准流程：**

#### 1️⃣ 修改TypeScript代码
```bash
# 编辑源代码文件
code plugins/fill-content-from-json/code.ts
```

#### 2️⃣ 重新编译
```bash
# 方法1: 使用npm脚本（推荐）
npm run build

# 方法2: 直接在插件目录编译
cd plugins/fill-content-from-json
npx tsc

# 方法3: 使用监听模式（开发时推荐）
npm run watch  # 自动监听变化并重新编译
```

#### 3️⃣ 在Figma中重新加载插件

**重要提醒**: 📢 **编译完成后，必须在Figma中重新加载插件才能看到最新修改！**

**快捷重载方式（推荐）**:
- 按 `Cmd+Option+R` (Mac) 或 `Ctrl+Alt+R` (Windows)

**手动重载方式**:
1. 在Figma中，点击菜单 `Plugins` → `Development` → `Your Plugin Name`
2. 或者右键点击插件图标 → `Restart`
3. 或者关闭插件窗口后重新启动

#### 4️⃣ 验证修改效果
- 测试新功能是否正常工作
- 检查控制台是否有错误信息
- 确认预期的修改已生效

### ⚡ 高效开发技巧

**使用监听模式进行快速开发**:
```bash
# 1. 启动监听模式（在项目根目录）
npm run watch

# 2. 修改 TypeScript 代码
# 3. 保存文件（自动触发编译）
# 4. 在Figma中按 Cmd+Option+R 重新加载
# 5. 重复步骤2-4进行迭代开发
```

**一键式开发流程**:
```bash
# 修改代码后的快速命令
npm run build && echo "✅ 编译完成，请在Figma中按 Cmd+Option+R 重新加载插件"
```

### 在Figma中添加插件

插件运行需要以下**必需文件**在同一目录：
- ✅ `manifest.json` - 插件配置文件
- ✅ `code.js` - 编译后的主代码文件
- ✅ `ui.html` - 插件UI界面文件（如果有UI）

#### 方法一：Figma桌面应用
1. 打开Figma桌面应用
2. 点击菜单 **Plugins** → **Development** → **Import plugin from manifest...**
3. 选择文件：`plugins/fill-content-from-json/manifest.json`
4. 插件将出现在插件列表中

#### 方法二：Figma网页版
1. 登录 https://figma.com
2. 打开任意设计文件
3. 右键点击空白处 → **Plugins** → **Development** → **Import plugin from manifest...**
4. 选择文件：`plugins/fill-content-from-json/manifest.json`

#### 🔄 重新加载插件 (重要!)
**每次修改代码后，需要在Figma中重新加载插件：**
1. 右键点击画布 → **Plugins** → **Development** → **Hot reload plugin**
2. 或者重新导入manifest.json文件

## 📦 已有插件

- **Fill Content from JSON** - 从JSON数据自动填充Figma文本图层，支持嵌套结构和智能匹配

## 🆕 开发新插件

### 创建新插件步骤
1. **创建插件目录**:
   ```bash
   mkdir plugins/your-plugin-name
   cd plugins/your-plugin-name
   ```

2. **创建必需文件**:
   - `manifest.json` - 插件配置 (参考现有插件)
   - `code.ts` - TypeScript源代码
   - `ui.html` - UI界面 (可选)
   - `tsconfig.json` - TypeScript配置 (复制现有配置)

3. **更新构建配置**:
   由于当前 `package.json` 中的构建命令只针对 `fill-content-from-json`，您需要：
   
   **选项A**: 修改 `package.json` 添加新插件的构建脚本
   **选项B**: 手动构建新插件:
   ```bash
   # 在插件目录下手动编译
   npx tsc -p plugins/your-plugin-name/tsconfig.json
   ```

4. **在Figma中测试**:
   导入新插件的 `manifest.json` 文件

### 插件基本结构模板

**manifest.json 模板**:
```json
{
  "name": "Your Plugin Name",
  "id": "your-plugin-id",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"],
  "permissions": ["currentuser"],
  "networkAccess": {
    "allowedDomains": ["none"]
  },
  "documentAccess": "dynamic-page"
}
```

## 🛠️ 故障排除

### 常见问题及解决方案

**❌ 问题：插件无法加载**
- ✅ 解决：确保运行了 `npm run build` 生成 `code.js` 文件
- ✅ 检查：`manifest.json` 中的 `main` 字段指向正确的 `.js` 文件

**❌ 问题：代码修改后没有生效**
- ✅ 解决：重新构建插件 (`npm run build`)
- ✅ 解决：在Figma中重新加载插件 (`Cmd+Option+R` 或 Hot reload plugin)
- ✅ 检查：确认 `code.js` 文件的修改时间是最新的
- ✅ 检查：编译过程中是否有错误信息

**❌ 问题：忘记编译就在Figma中测试**
- ✅ 提醒：**必须先编译** (`npm run build`) **再在Figma中重新加载**
- ✅ 提醒：TypeScript源码 (`code.ts`) 修改后不会自动生效
- ✅ 建议：使用 `npm run watch` 监听模式避免忘记编译

**❌ 问题：不确定是否编译成功**
- ✅ 检查：查看 `plugins/fill-content-from-json/code.js` 文件是否存在且为最新
- ✅ 检查：编译命令是否有错误输出
- ✅ 验证：`ls -la plugins/fill-content-from-json/code.js` 查看文件修改时间

**❌ 问题：TypeScript编译错误**
- ✅ 检查：`tsconfig.json` 配置是否正确
- ✅ 检查：是否安装了所需的类型定义 (`@figma/plugin-typings`)

**❌ 问题：插件在Figma中找不到**
- ✅ 确保：选择了正确的 `manifest.json` 文件路径
- ✅ 确保：`code.js` 和 `manifest.json` 在同一目录

### 调试技巧
- 📝 在Figma中按 `F12` 打开开发者工具查看控制台错误
- 🔍 使用 `console.log()` 在插件代码中添加调试信息
- 🧪 使用 `npm run lint` 检查代码语法问题

## 💡 开发提示

### 📋 开发最佳实践
- **代码修改后**: 始终运行 `npm run build` 重新编译
- **开发模式**: 使用 `npm run dev` 或 `npm run watch` 自动监听文件变化
- **测试前**: 确保编译生成了最新的 `code.js` 文件
- **插件重载**: 每次修改后在Figma中重新加载插件
- **代码检查**: 定期使用 `npm run lint` 检查代码规范
- **自动修复**: 使用 `npm run lint:fix` 自动修复代码格式问题
- **清理文件**: 使用 `npm run clean` 删除编译生成的 `code.js` 文件

### 🚀 效率提升
- 📁 保持项目结构整洁，遵循现有的文件组织方式
- 🔄 开发时启用 watch 模式，减少手动构建次数
- 📊 利用Figma的开发者工具进行调试
- 📚 参考 [Figma Plugin API 文档](https://www.figma.com/plugin-docs/) 获取最新信息

### 🎯 性能优化
- ⚡ 避免在插件中进行大量DOM操作
- 🎨 合理使用Figma API，避免不必要的节点遍历
- 💾 缓存重复计算的结果

---

🎉 **开始您的Figma插件开发之旅吧！** 如有问题，请查看故障排除章节或参考Figma官方文档。
