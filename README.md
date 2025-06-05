# Figma插件开发工程

这是一个用于开发Figma插件的通用工程项目，支持TypeScript和模块化插件管理。

## 项目结构

```
├── plugins/                 # 插件目录
│   ├── fill-content-from-json/  # 填充JSON内容插件
│   │   ├── code.js          # 编译后的主代码
│   │   ├── code.ts          # TypeScript源代码
│   │   ├── ui.html          # 插件UI界面
│   │   ├── manifest.json    # 插件配置文件
│   │   └── tsconfig.json    # 插件TypeScript编译配置
│   └── [其他插件]/           # 未来的其他插件
├── shared/                  # 共享代码库
│   ├── types/              # 共享类型定义
│   └── utils/              # 共享工具函数
├── package.json            # 项目依赖配置
├── tsconfig.json           # 根目录TypeScript编译配置
└── README.md              # 项目说明
```

## 快速开始

### 环境要求

1. 安装 Node.js: https://nodejs.org/
2. 安装依赖:
   ```bash
   npm install
   ```

## 🚀 开发模式说明

### 基础构建
```bash
npm run build           # 完整构建（推荐生产环境）
npm run build:fill-content  # 完整构建（包含依赖编译和清理）
```

### 开发模式选择

#### 1. 🎯 智能开发模式（推荐）
```bash
npm run dev
```
**适用场景**: 日常开发时使用
**功能**: 
- 同时监听共享文件(`shared/`)和插件代码(`code.ts`)变化
- 自动重新编译
- **注意**: 仍需手动清理重复文件夹

#### 2. 🔧 仅插件监听模式
```bash
npm run watch:fill-content
```
**适用场景**: 只修改插件代码，不修改共享文件时
**功能**: 
- 仅监听插件代码变化
- 不会重新编译共享依赖

#### 3. 🛠 手动构建模式
```bash
npm run build:plugin-only
```
**适用场景**: 精确控制构建时机
**功能**: 
- 只编译插件代码
- 自动清理重复文件夹

## 📋 开发流程建议

### 方案一：完全自动化（适合频繁开发）
1. 启动开发模式: `npm run dev`
2. 修改代码（自动重新编译）
3. 测试插件时手动运行: `npm run build:plugin-only`（清理重复文件夹）

### 方案二：半自动化（平衡性能和体验）
1. 首次构建: `npm run build`
2. 只修改插件代码时: `npm run watch:fill-content`
3. 修改共享文件时: 重新运行 `npm run build`

### 方案三：手动控制（适合偶尔开发）
1. 每次修改后运行: `npm run build`
2. 完全的构建控制，但需要手动操作

## 🔄 清理重复文件夹

如果发现插件目录下出现重复的 `shared` 或 `plugins` 文件夹：
```bash
npm run build:plugin-only  # 自动清理
# 或手动清理
rm -rf plugins/fill-content-from-json/shared plugins/fill-content-from-json/plugins
```

## 💡 开发提示

- **共享文件修改**: 需要重新构建整个项目(`npm run build`)
- **插件代码修改**: 可以使用监听模式快速编译
- **测试前**: 建议运行 `npm run build:plugin-only` 确保目录清洁
- **出现编译错误**: 先尝试 `npm run build` 重新构建所有依赖

## 🧪 代码检查

```bash
npm run lint        # 代码检查
npm run lint:fix    # 自动修复代码风格问题
```

### 在Figma中添加插件

#### 方法一：添加本地插件
1. 打开Figma桌面应用
2. 点击菜单 **Plugins** → **Development** → **Import plugin from manifest...**
3. 选择插件文件夹中的 `manifest.json` 文件（例如：`plugins/fill-content-from-json/manifest.json`）

#### 方法二：通过Figma网页版
1. 登录 https://figma.com
2. 打开任意设计文件
3. 右键点击空白处 → **Plugins** → **Development** → **Import plugin from manifest...**
4. 选择对应的 `manifest.json` 文件

### 插件运行所需文件

对于每个插件，Figma需要以下文件在同一目录下：
- `manifest.json` - 插件配置文件（必需）
- `code.js` - 编译后的主代码文件（必需）
- `ui.html` - 插件UI界面文件（如果插件有UI界面）

## 已有插件

### fill-content-from-json
根据JSON数据填充Figma文本图层的插件。

**功能特性：**
- 支持JSON文件导入
- 智能匹配图层名称与JSON键
- 支持嵌套JSON结构
- 支持任意深度的文本图层

**使用方法：**
1. 选择要填充的Frame
2. 运行插件
3. 选择JSON文件
4. 点击"填充内容"

## 开发新插件

1. 在 `plugins/` 目录下创建新的插件文件夹
2. 创建必需的文件：`manifest.json`、`code.ts`、`ui.html`（可选）
3. 在根目录运行 `npm run build` 编译TypeScript
4. 在Figma中导入新插件的 `manifest.json`
