import { ThreeEvent } from '@react-three/fiber';
import { VIADefinitionV2, VIADefinitionV3, VIAKey } from '@the-via/reader';
import { TestKeyState } from 'src/types/types';
import { BufferGeometry } from 'three';

// 显示模式枚举定义
export enum DisplayMode {
  Test = 1,              // 测试模式
  Configure = 2,        // 配置模式
  Design = 3,           // 设计模式
  ConfigureColors = 4,  // 配置颜色模式
}  

// 按键帽状态枚举定义
export enum KeycapState {
  Pressed = 1,    // 按下状态
  Unpressed = 2,  // 未按下状态
}

// 键盘按键颜色配对
export type KeyColorPair = {
  c: string;  // 颜色
  t: string;  // 纹理或文本颜色
};

// 维度类型，二维或三维
export type NDimension = '2D' | '3D';

// 键盘画布内容属性
export type KeyboardCanvasContentProps<T> = {
  matrixKeycodesList?: number[][]
  selectable: boolean;            // 是否可以选择
  matrixKeycodes: number[];       // 矩阵键码
  keys: (VIAKey & { ei?: number })[]; // 按键数组，包含可选的 ei 属性
  definition: VIADefinitionV2 | VIADefinitionV3; // VIA定义
  pressedKeys?: TestKeyState[];   // 当前被按下的按键状态
  mode: DisplayMode;              // 显示模式
  showMatrix?: boolean;           // 是否显示矩阵
  selectedKey?: number;           // 选中的按键
  keyColors?: number[][];         // 按键颜色数组
  onKeycapPointerDown?: (e: T, idx: number) => void; // 按键被按下时的回调
  onKeycapPointerOver?: (e: T, idx: number) => void; // 按键被悬停时的回调
  width: number;                  // 画布宽度
  height: number;                 // 画布高度
};

// 键盘画布属性，继承自 KeyboardCanvasContentProps，省略 width 和 height
export type KeyboardCanvasProps<T> = Omit<
  KeyboardCanvasContentProps<T>,
  'width' | 'height'
> & {
  shouldHide?: boolean;           // 是否应该隐藏
  containerDimensions: DOMRect;  // 容器的维度
};

// 按键组属性
export type KeyGroupProps<T> = {
  selectable?: boolean;           // 是否可以选择
  keys: VIAKey[];                 // 按键数组
  matrixKeycodes: number[];       // 矩阵键码
  matrixKeycodesList?: number[][]; //
  definition: VIADefinitionV2 | VIADefinitionV3; // VIA定义
  mode: DisplayMode;              // 显示模式
  pressedKeys?: TestKeyState[];   // 当前被按下的按键状态
  keyColors?: number[][];         // 按键颜色数组
  selectedKey?: number;           // 选中的按键
  onKeycapPointerDown?: (e: T, idx: number) => void; // 按键被按下时的回调
  onKeycapPointerOver?: (e: T, idx: number) => void; // 按键被悬停时的回调
};

// 按键的坐标和属性
export type KeyCoords<T> = {
  position: [number, number, number]; // 位置坐标
  rotation: [number, number, number]; // 旋转角度
  scale: [number, number, number];    // 缩放比例
  color: KeyColorPair;                 // 颜色配对
  idx: number;                         // 按键索引
  meshKey: string;                     // 网格的键
  onClick: (e: T, idx: number) => void; // 点击事件的回调
  onPointerDown?: (e: T, idx: number) => void; // 指针按下事件的回调
  onPointerOver?: (e: T, idx: number) => void; // 指针悬停事件的回调
};

// 按键集合的坐标和索引
export type KeysKeys<T> = {
  indices: string[];       // 索引数组
  coords: KeyCoords<T>[];  // 按键坐标数组
};

// 按键帽共享属性
export type KeycapSharedProps<T> = {
  label: any;              // 标签
  selected: boolean;      // 是否被选中
  disabled: boolean;      // 是否禁用
  keyState: number;       // 按键状态
  shouldRotate: boolean;  // 是否应该旋转
  textureOffsetX: number; // 纹理偏移X
  textureWidth: number;   // 纹理宽度
  textureHeight: number;  // 纹理高度
  mode: DisplayMode;      // 显示模式
  key: string;            // 键
  skipFontCheck: boolean; // 是否跳过字体检查
} & Omit<KeyCoords<T>, 'meshKey'>; // 继承 KeyCoords，省略 meshKey

// 2D按键帽属性
export type TwoStringKeycapProps = {
  clipPath: null | string; // 剪切路径，可能为 null 或字符串
} & KeycapSharedProps<React.MouseEvent<Element, MouseEvent>>; // 继承 KeycapSharedProps，事件类型为 React 的鼠标事件

// 3D按键帽属性
export type ThreeFiberKeycapProps = {
  keycapGeometry: BufferGeometry; // 按键帽的几何体
} & KeycapSharedProps<ThreeEvent<MouseEvent>>; // 继承 KeycapSharedProps，事件类型为 Three.js 的事件
