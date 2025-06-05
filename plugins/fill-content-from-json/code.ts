// 填充JSON内容插件
// 支持从JSON文件导入数据并根据图层名称匹配填充文本图层
// 支持嵌套JSON结构和任意深度的文本图层

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// ============= 类型定义 =============
interface PluginMessage {
  type: string;
  [key: string]: any;
}

interface TextNodeWithPath {
  node: TextNode;
  path: SceneNode[];
}

interface JsonData {
  [key: string]: any;
}

// UI相关类型
interface UIMessageBase {
  type: string;
}

interface FillContentMessage extends UIMessageBase {
  type: 'fill-content';
  jsonData: JsonData;
}

type UIMessage = FillContentMessage; 

// ============= 工具函数 =============

/**
 * 递归查找节点中的所有文本节点
 */
function findAllTextNodesInNode(node: SceneNode): TextNode[] {
  const textNodes: TextNode[] = [];
  
  if (node.type === 'TEXT') {
    textNodes.push(node);
  } else if ('children' in node) {
    for (const child of node.children) {
      textNodes.push(...findAllTextNodesInNode(child));
    }
  }
  
  return textNodes;
}

/**
 * 递归查找所有文本节点及其完整路径
 */
function findAllTextNodesWithPath(
  node: SceneNode, 
  path: SceneNode[] = []
): TextNodeWithPath[] {
  const results: TextNodeWithPath[] = [];
  const currentPath = [...path, node];
  
  if (node.type === 'TEXT') {
    results.push({ node: node, path: currentPath });
  } else if ('children' in node) {
    for (const child of node.children) {
      results.push(...findAllTextNodesWithPath(child, currentPath));
    }
  }
  
  return results;
}

/**
 * 显示通知消息
 */
function showNotification(message: string): void {
  figma.notify(message);
}

/**
 * 获取选中的节点
 */
function getSelectedNodes(): readonly SceneNode[] {
  return figma.currentPage.selection;
}

/**
 * 检查是否有选中的节点
 */
function hasSelection(): boolean {
  return figma.currentPage.selection.length > 0;
}

// 显示插件UI
figma.showUI(__html__, { width: 300, height: 320 });

// 存储导入的JSON数据
let jsonData: JsonData | null = null;

figma.ui.onmessage = (msg: UIMessage) => {
  if (msg.type === 'fill-content' && 'jsonData' in msg) {
    jsonData = msg.jsonData;
    fillSelectedFrames();
  }
};

/**
 * 根据JSON数据填充选中Frame中的文本图层
 */
async function fillSelectedFrames(): Promise<void> {
  if (!jsonData) {
    showNotification('没有加载JSON数据');
    return;
  }

  if (!hasSelection()) {
    showNotification('请选择至少一个Frame');
    return;
  }
  
  const selection = getSelectedNodes();
  let updatedLayers = 0;
  let fontsToLoad = new Set<string>();
  let textNodesWithValues: Array<{node: TextNode, value: string}> = [];
  
  // 处理所有选中的节点
  for (const node of selection) {
    const result = processNode(node, jsonData);
    
    // 收集字体信息
    for (const item of result.textNodesWithValues) {
      for (const font of item.node.getRangeAllFontNames(0, item.node.characters.length)) {
        fontsToLoad.add(JSON.stringify(font));
      }
    }
    
    textNodesWithValues.push(...result.textNodesWithValues);
  }
  
  // 加载字体并更新文本
  try {
    await loadFontsAndUpdateText(fontsToLoad, textNodesWithValues);
    updatedLayers = textNodesWithValues.length;
    
    if (updatedLayers > 0) {
      showNotification(`成功填充了 ${updatedLayers} 个文本图层`);
    } else {
      showNotification('未找到与JSON键匹配的文本图层');
    }
  } catch (err) {
    showNotification('加载字体时出错');
    console.error(err);
  }
}

/**
 * 处理单个节点，查找匹配的JSON数据
 */
function processNode(node: SceneNode, data: JsonData): {
  textNodesWithValues: Array<{node: TextNode, value: string}>
} {
  const textNodesWithValues: Array<{node: TextNode, value: string}> = [];
  const frameName = node.name;
  const frameData = data[frameName];
  
  // 查找所有文本节点及其路径
  const textNodesWithPaths = findAllTextNodesWithPath(node);
  
  for (const {node: textNode, path} of textNodesWithPaths) {
    const jsonValue = findJsonValueForTextNode(textNode, path, frameData, data);
    
    if (jsonValue !== null) {
      textNodesWithValues.push({node: textNode, value: String(jsonValue)});
    }
  }
  
  return { textNodesWithValues };
}

/**
 * 为文本节点查找对应的JSON值
 */
function findJsonValueForTextNode(
  textNode: TextNode, 
  path: SceneNode[], 
  frameData: any, 
  rootData: JsonData
): any {
  const layerName = textNode.name;
  
  // 情况1: 从Frame同名的对象中获取值 (直接子元素)
  if (frameData && typeof frameData === 'object' && layerName in frameData) {
    return frameData[layerName];
  }
  
  // 情况2: 尝试使用路径查找嵌套元素
  if (frameData && typeof frameData === 'object' && path.length > 0) {
    const jsonValue = findValueByPath(frameData, path, layerName);
    if (jsonValue !== null) {
      return jsonValue;
    }
    
    // 如果路径查找失败，尝试只用图层名称匹配
    if (layerName in frameData) {
      return frameData[layerName];
    }
  }
  
  // 情况3: 直接从顶层JSON获取值（向后兼容）
  if (layerName in rootData) {
    return rootData[layerName];
  }
  
  return null;
}

/**
 * 根据路径查找JSON值
 */
function findValueByPath(frameData: any, path: SceneNode[], layerName: string): any {
  // 移除第一个元素（Frame名称）并创建路径数组
  const pathParts = path.slice(1).map(node => node.name);
  pathParts.push(layerName);
  
  let currentObj = frameData;
  
  // 遍历路径，逐层查找
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    
    if (i === pathParts.length - 1) {
      // 最后一个路径部分，直接获取值
      return part in currentObj ? currentObj[part] : null;
    } else {
      // 不是最后一个部分，继续深入对象
      if (currentObj[part] && typeof currentObj[part] === 'object') {
        currentObj = currentObj[part];
      } else {
        return null;
      }
    }
  }
  
  return null;
}

/**
 * 加载字体并更新文本节点
 */
async function loadFontsAndUpdateText(
  fontsToLoad: Set<string>,
  textNodesWithValues: Array<{node: TextNode, value: string}>
): Promise<void> {
  // 加载所有需要的字体
  const fontLoadPromises = Array.from(fontsToLoad).map(fontStr => {
    const font = JSON.parse(fontStr);
    return figma.loadFontAsync(font);
  });
  
  await Promise.all(fontLoadPromises);
  
  // 更新文本节点
  for (const {node, value} of textNodesWithValues) {
    node.characters = value;
  }
  
  return;
}
