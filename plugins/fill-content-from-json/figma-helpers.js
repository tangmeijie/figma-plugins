"use strict";
// Figma插件通用工具函数和类型定义
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllTextNodesInNode = findAllTextNodesInNode;
exports.findAllTextNodesWithPath = findAllTextNodesWithPath;
exports.showNotification = showNotification;
exports.getSelectedNodes = getSelectedNodes;
exports.hasSelection = hasSelection;
// ============= 工具函数 =============
/**
 * 递归查找节点中的所有文本节点
 */
function findAllTextNodesInNode(node) {
    const textNodes = [];
    if (node.type === 'TEXT') {
        textNodes.push(node);
    }
    else if ('children' in node) {
        for (const child of node.children) {
            textNodes.push(...findAllTextNodesInNode(child));
        }
    }
    return textNodes;
}
/**
 * 递归查找所有文本节点及其完整路径
 */
function findAllTextNodesWithPath(node, path = []) {
    const results = [];
    const currentPath = [...path, node];
    if (node.type === 'TEXT') {
        results.push({ node: node, path: currentPath });
    }
    else if ('children' in node) {
        for (const child of node.children) {
            results.push(...findAllTextNodesWithPath(child, currentPath));
        }
    }
    return results;
}
/**
 * 显示通知消息
 */
function showNotification(message) {
    figma.notify(message);
}
/**
 * 获取选中的节点
 */
function getSelectedNodes() {
    return figma.currentPage.selection;
}
/**
 * 检查是否有选中的节点
 */
function hasSelection() {
    return figma.currentPage.selection.length > 0;
}
