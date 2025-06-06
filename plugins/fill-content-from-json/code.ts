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
 * 在JSON对象中递归查找匹配的键
 */
function findKeyInNestedJson(obj: any, targetKey: string): any {
  // 直接检查当前对象是否有目标键
  if (obj && typeof obj === 'object' && obj[targetKey]) {
    return obj[targetKey];
  }
  
  // 递归查找嵌套对象
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      const value = obj[key];
      if (value && typeof value === 'object') {
        const result = findKeyInNestedJson(value, targetKey);
        if (result !== null) {
          return result;
        }
      }
    }
  }
  
  return null;
}

/**
 * 递归查找匹配的Frame数据
 */
function findMatchingFrameData(node: SceneNode, data: JsonData): any {
  // 首先检查当前节点名称是否在JSON中存在
  const directMatch = findKeyInNestedJson(data, node.name);
  if (directMatch) {
    return directMatch;
  }
  
  // 如果当前节点没有匹配，递归查找子节点
  if ('children' in node) {
    for (const child of node.children) {
      const childData = findMatchingFrameData(child, data);
      if (childData !== null) {
        return childData;
      }
    }
  }
  
  return null;
}

/**
 * 收集同名文本节点
 */
function collectSameNameTextNodes(allTextNodes: TextNodeWithPath[], targetName: string): TextNode[] {
  return allTextNodes
    .filter(({node}) => node.name === targetName)
    .map(({node}) => node);
}

/**
 * 查找重复的容器节点（如多个Content）并为其分配索引
 * 改进版：只对同一父节点下的同名容器进行分组和排序
 * 这样避免了不同层级的同名容器相互干扰
 */
function findRepeatingContainers(textNodesWithPaths: TextNodeWithPath[]): Map<SceneNode, number> {
  const containerIndexMap = new Map<SceneNode, number>();
  // 使用 "父节点ID_容器名" 作为分组键，确保只有同一父节点下的同名容器才会被分组
  const containerGroups = new Map<string, SceneNode[]>();
  
  // 收集所有路径中的容器节点，按父节点分组
  for (const {path} of textNodesWithPaths) {
    for (let i = 0; i < path.length - 1; i++) { // 排除文本节点本身
      const container = path[i];
      const containerName = container.name;
      const parentId = container.parent ? container.parent.id : 'root';
      
      // 创建分组键：父节点ID + 容器名
      const groupKey = `${parentId}_${containerName}`;
      
      if (!containerGroups.has(groupKey)) {
        containerGroups.set(groupKey, []);
      }
      
      const existingContainers = containerGroups.get(groupKey)!;
      if (!existingContainers.includes(container)) {
        existingContainers.push(container);
      }
    }
  }
  
  // 为重复的容器分配索引
  for (const [groupKey, containers] of containerGroups) {
    if (containers.length > 1) {

      // 按照容器在文档中的顺序排序（现在都是同一父节点下的容器）
      containers.sort((a: SceneNode, b: SceneNode) => {
        // 由于按父节点分组，所有容器都有相同的父节点，直接使用children顺序
        if (a.parent && 'children' in a.parent) {
          const children = a.parent.children;
          return children.indexOf(a) - children.indexOf(b);
        }
        return 0;
      });
      
      // 分配索引
      containers.forEach((container: SceneNode, index: number) => {
        containerIndexMap.set(container, index);
      });
    }
  }
  
  return containerIndexMap;
}

/**
 * 获取文本节点对应的容器索引
 */
function getContainerIndexForTextNode(
  path: SceneNode[], 
  containerIndexMap: Map<SceneNode, number>
): number | null {
  // 从路径的倒数第二个开始向前查找（倒数第一个是文本节点本身）
  for (let i = path.length - 2; i >= 0; i--) {
    const container = path[i];
    if (containerIndexMap.has(container)) {
      return containerIndexMap.get(container)!;
    }
  }
  return null;
}

/**
 * 处理单个节点，查找匹配的JSON数据
 */
function processNode(node: SceneNode, data: JsonData): {
  textNodesWithValues: Array<{node: TextNode, value: string}>
} {
  const textNodesWithValues: Array<{node: TextNode, value: string}> = [];
  
  // 查找所有文本节点及其路径
  const textNodesWithPaths = findAllTextNodesWithPath(node);
  
  // 识别重复的容器并分配索引
  const containerIndexMap = findRepeatingContainers(textNodesWithPaths);
  


  // 创建一个用于跟踪已处理的同名节点的Map（用于非数组情况）
  const processedSameNameNodes = new Map<string, number>();
  
  for (const {node: textNode, path} of textNodesWithPaths) {
    const layerName = textNode.name;
    
            // 为每个文本节点尝试多种匹配策略
        const jsonValue = findJsonValueForTextNodeAdvanced(textNode, path, data);
        

        if (jsonValue !== null) {
          // 检查是否为数组类型
          if (Array.isArray(jsonValue)) {
                    // 优先使用容器索引策略
            const containerIndex = getContainerIndexForTextNode(path, containerIndexMap);
            

            if (containerIndex !== null && containerIndex < jsonValue.length) {
                        // 使用容器索引从数组中获取对应的元素
              const arrayItem = jsonValue[containerIndex];
              
              if (arrayItem !== undefined) {
                // 情况1: 字符串数组 - 直接使用数组元素
                if (typeof arrayItem === 'string' || typeof arrayItem === 'number') {
                  textNodesWithValues.push({
                    node: textNode, 
                    value: String(arrayItem)
                  });
                }
                // 情况2: 对象数组 - 在对象中查找对应键
                else if (typeof arrayItem === 'object' && arrayItem !== null && layerName in arrayItem) {
                  textNodesWithValues.push({
                    node: textNode, 
                    value: String(arrayItem[layerName])
                  });
                }
              }
        } else {
          // 降级到原有的同名节点处理方式
          if (!processedSameNameNodes.has(layerName)) {
            processedSameNameNodes.set(layerName, 0);
          }
          
          const nodeIndex = processedSameNameNodes.get(layerName)!;
          
          if (nodeIndex < jsonValue.length) {
            const arrayItem = jsonValue[nodeIndex];
            
            // 降级逻辑也要处理不同类型的数组元素
            if (arrayItem !== undefined) {
              // 情况1: 字符串数组 - 直接使用数组元素
              if (typeof arrayItem === 'string' || typeof arrayItem === 'number') {
                textNodesWithValues.push({
                  node: textNode, 
                  value: String(arrayItem)
                });
              }
              // 情况2: 对象数组 - 在对象中查找对应键
              else if (typeof arrayItem === 'object' && arrayItem !== null && layerName in arrayItem) {
                textNodesWithValues.push({
                  node: textNode, 
                  value: String(arrayItem[layerName])
                });
              }
              // 情况3: 其他类型，尝试直接转换
              else {
                textNodesWithValues.push({
                  node: textNode, 
                  value: String(arrayItem)
                });
              }
            }
          }
          
          processedSameNameNodes.set(layerName, nodeIndex + 1);
        }
      } else {
        // 非数组类型，直接使用值
        textNodesWithValues.push({node: textNode, value: String(jsonValue)});
      }
    }
  }
  
  return { textNodesWithValues };
}

/**
 * 改进的文本节点JSON值查找函数
 */
function findJsonValueForTextNodeAdvanced(
  textNode: TextNode, 
  path: SceneNode[], 
  rootData: JsonData
): any {
  const layerName = textNode.name;
  
  // 策略1: 在整个JSON中递归查找Frame名称，然后处理对应数据
  for (let i = 1; i < path.length; i++) {  // 跳过第一个元素（根节点）
    const frameName = path[i].name;
    const frameData = findKeyInNestedJson(rootData, frameName);
    
    if (frameData) {
      // 如果frameData是数组，直接返回数组（让后续逻辑处理索引）
      if (Array.isArray(frameData)) {
        return frameData;
      }
      
      // 如果frameData是对象，在其中查找图层名称
      if (typeof frameData === 'object') {
        if (layerName in frameData) {
          return frameData[layerName];
        }
        
        // 尝试路径查找
        const pathValue = findValueByPath(frameData, path.slice(i), layerName);
        if (pathValue !== null) {
          return pathValue;
        }
      }
    }
  }
  
  // 策略2: 直接在整个JSON中查找图层名称
  const directValue = findKeyInNestedJson(rootData, layerName);
  if (directValue !== null) {
    return directValue;
  }
  
  // 策略3: 在顶层查找（向后兼容扁平结构）
  if (layerName in rootData) {
    return rootData[layerName];
  }
  
  return null;
}

/**
 * 为文本节点查找对应的JSON值（保留原函数以防需要）
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
  if (!frameData || typeof frameData !== 'object') {
    return null;
  }
  
  // 如果path为空或只有一个元素，直接在frameData中查找layerName
  if (path.length <= 1) {
    return layerName in frameData ? frameData[layerName] : null;
  }
  
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
