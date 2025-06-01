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

### 开发流程

1. 编译TypeScript代码:
   ```bash
   npm run build
   ```

2. 监听文件变化自动编译:
   ```bash
   npm run watch
   ```

3. 代码检查:
   ```bash
   npm run lint
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
