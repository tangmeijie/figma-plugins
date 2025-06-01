// Figma插件通用工具函数

import { TextNodeWithPath } from '../types/figma';

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