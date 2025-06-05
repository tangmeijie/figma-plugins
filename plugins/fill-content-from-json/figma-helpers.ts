// Figma插件通用工具函数和类型定义

// ============= 类型定义 =============
export interface PluginMessage {
  type: string;
  [key: string]: any;
}

export interface TextNodeWithPath {
  node: TextNode;
  path: SceneNode[];
}

export interface JsonData {
  [key: string]: any;
}

// UI相关类型
export interface UIMessageBase {
  type: string;
}

export interface FillContentMessage extends UIMessageBase {
  type: 'fill-content';
  jsonData: JsonData;
}

export type UIMessage = FillContentMessage; 

// ============= 工具函数 =============

/**
 * 递归查找节点中的所有文本节点
 */
export function findAllTextNodesInNode(node: SceneNode): TextNode[] {
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
export function findAllTextNodesWithPath(
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
export function showNotification(message: string): void {
  figma.notify(message);
}

/**
 * 获取选中的节点
 */
export function getSelectedNodes(): readonly SceneNode[] {
  return figma.currentPage.selection;
}

/**
 * 检查是否有选中的节点
 */
export function hasSelection(): boolean {
  return figma.currentPage.selection.length > 0;
} 