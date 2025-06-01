// Figma插件通用类型定义

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