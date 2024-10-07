import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit'; 
// 从 @reduxjs/toolkit 中导入 createSelector 和 createSlice 用于创建选择器和切片，PayloadAction 用于定义动作的负载类型
import type {
  ConnectedDevice, // 连接的设备类型
  DeviceLayerMap, // 设备层映射类型
  Keymap, // 键映射类型
  Layer, // 层类型
} from '../types/types'; // 从 ../types/types 文件中导入相关类型定义
import type {AppThunk, RootState} from './index'; // 导入 AppThunk（用于异步动作）和 RootState（全局状态类型）
import {
  getDefinitions, // 从 definitionsSlice 中导入选择器，用于获取设备定义
  getSelectedDefinition, // 获取选中的设备定义
  getSelectedKeyDefinitions, // 获取选中的键定义
} from './definitionsSlice'; 
import {
  getSelectedConnectedDevice, // 获取当前选中的连接设备
  getSelectedDevicePath, // 获取当前选中的设备路径
  getSelectedKeyboardAPI, // 获取键盘 API 实例
  selectDevice, // 选择设备的动作
} from './devicesSlice';
import {KeyboardAPI} from 'src/utils/keyboard-api'; // 导入自定义的键盘 API 工具类

// 定义键映射状态类型，包括设备层映射、层数、选中层索引、选中键、键盘是否可选状态和选中的调色板颜色
type KeymapState = {
  rawDeviceMap: DeviceLayerMap; // 原始设备层映射
  numberOfLayers: number; // 层数
  selectedLayerIndex: number; // 选中的层索引
  selectedKey: number | null; // 选中的键，null 表示没有选中键
  configureKeyboardIsSelectable: boolean; // 配置键盘是否可以选择
  selectedPaletteColor: [number, number]; // 选中的调色板颜色，使用 [色调, 饱和度] 数组表示
};

// 初始化键映射状态
const initialState: KeymapState = {
  rawDeviceMap: {}, // 初始化为空的设备层映射
  numberOfLayers: 4, // 初始层数为 4
  selectedLayerIndex: 0, // 默认选中第一层
  selectedKey: null, // 初始没有选中任何键
  configureKeyboardIsSelectable: false, // 配置键盘默认不可选
  selectedPaletteColor: [0, 0], // 默认选中的调色板颜色为 [0, 0]，即无颜色
};

// 使用 createSlice 创建键映射切片，定义 reducers（状态变更逻辑）和初始状态
const keymapSlice = createSlice({
  name: 'keymap', // 切片的名称
  initialState, // 初始化状态
  reducers: {
    // 设置选中的调色板颜色
    setSelectedPaletteColor: (
      state,
      action: PayloadAction<[number, number]>, // 动作的负载是一个包含两个数值的数组，表示色调和饱和度
    ) => {
      state.selectedPaletteColor = action.payload; // 将传入的颜色值更新到状态中
    },
    // 设置层数
    setNumberOfLayers: (state, action: PayloadAction<number>) => {
      state.numberOfLayers = action.payload; // 更新层数
    },
    // 设置键盘是否可选择
    setConfigureKeyboardIsSelectable: (
      state,
      action: PayloadAction<boolean>, // 负载为布尔值，表示是否可选择
    ) => {
      state.configureKeyboardIsSelectable = action.payload; // 更新是否可选择状态
    },
    // 成功加载某一层的键映射
    loadLayerSuccess: (
      state,
      action: PayloadAction<{
        layerIndex: number; // 层索引
        keymap: Keymap; // 键映射
        devicePath: string; // 设备路径
      }>,
    ) => {
      const {layerIndex, keymap, devicePath} = action.payload; // 从动作中解构出层索引、键映射和设备路径
      // 初始化或更新指定设备路径的层映射，如果该设备还没有映射，则创建一个新数组
      state.rawDeviceMap[devicePath] =
        state.rawDeviceMap[devicePath] ||
        Array(state.numberOfLayers).fill({
          keymap: [], // 初始的键映射为空
          isLoaded: false, // 标识层是否加载完毕
        });
      // 更新指定层的键映射并标记为已加载
      state.rawDeviceMap[devicePath][layerIndex] = {
        keymap,
        isLoaded: true,
      };
    },
    // 设置当前选中的层
    setLayer: (state, action: PayloadAction<number>) => {
      state.selectedLayerIndex = action.payload;
    },
    // 清除选中的键
    clearSelectedKey: (state) => {
      state.selectedKey = null;
    },
    // 更新选中的键
    updateSelectedKey: (state, action: PayloadAction<number | null>) => {
      state.selectedKey = action.payload;
      console.log(state.selectedKey);
      
    },
    // 成功保存键映射
    saveKeymapSuccess: (
      state,
      action: PayloadAction<{layers: Layer[]; devicePath: string}>,
    ) => {
      const {layers, devicePath} = action.payload; // 解构层和设备路径
      console.log(layers, devicePath);
      
      // 更新设备路径的所有层
      state.rawDeviceMap[devicePath] = layers;
      console.log( state.rawDeviceMap[devicePath]);
      
    },
    // 设置特定设备路径某一键的值
    setKey: (
      state,
      action: PayloadAction<{
        devicePath: string; // 设备路径
        keymapIndex: number; // 键映射索引
        value: number; // 键值
      }>,
    ) => {
      const {keymapIndex, value, devicePath} = action.payload;
      const {selectedLayerIndex} = state; // 获取当前选中的层索引
      // 更新指定设备路径的键映射
      state.rawDeviceMap[devicePath][selectedLayerIndex].keymap[keymapIndex] =
        value;
    },
  },
  extraReducers: (builder) => {
    // 当选择设备时，重置选中的键
    builder.addCase(selectDevice, (state) => {
      state.selectedKey = null;
    });
  },
});

// 导出 actions
export const {
  setNumberOfLayers,
  setLayer,
  loadLayerSuccess,
  clearSelectedKey,
  setKey,
  updateSelectedKey,
  saveKeymapSuccess,
  setConfigureKeyboardIsSelectable,
  setSelectedPaletteColor,
} = keymapSlice.actions;

export default keymapSlice.reducer; // 导出 reducer 以供 store 使用

// 异步动作：从设备加载键映射
export const loadKeymapFromDevice =
  (connectedDevice: ConnectedDevice): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();

    if (getLoadProgress(state) === 1) {
      return; // 如果加载进度已完成，直接返回
    }

    const {path, vendorProductId, requiredDefinitionVersion} = connectedDevice;
    const api = getSelectedKeyboardAPI(state) as KeyboardAPI; // 获取键盘 API 实例

    const numberOfLayers = await api.getLayerCount(); // 获取设备的层数
    dispatch(setNumberOfLayers(numberOfLayers)); // 更新层数

    const {matrix} =
      getDefinitions(state)[vendorProductId][requiredDefinitionVersion]; // 获取设备的键盘矩阵定义

    // 逐层读取键映射并分发加载成功的动作
    for (var layerIndex = 0; layerIndex < numberOfLayers; layerIndex++) {
      const keymap = await api.readRawMatrix(matrix, layerIndex);
      dispatch(loadLayerSuccess({layerIndex, keymap, devicePath: path}));
    }
  };

// TODO: 为什么这个 keymap 不是 Keymap 类型（即 number[]）？
// TODO: 这里是否应该使用当前选中的设备？

// 异步动作：将原始键映射保存到设备
export const saveRawKeymapToDevice =
  (keymap: number[][], connectedDevice: ConnectedDevice): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const {path} = connectedDevice;
    const api = getSelectedKeyboardAPI(state);
    const definition = getSelectedDefinition(state);
    if (!path || !definition || !api) {
      return;
    }

    const {matrix} = definition;

    await api.writeRawMatrix(matrix, keymap); // 将键映射写入设备
    const layers = keymap.map((layer) => ({
      keymap: layer,
      isLoaded: true,
    }));
    dispatch(saveKeymapSuccess({layers, devicePath: path})); // 分发保存成功的动作
  };

// 异步动作：更新某一键
export const updateKey =
  (keyIndex: number, value: number): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const keys = getSelectedKeyDefinitions(state); // 获取键定义
    const connectedDevice = getSelectedConnectedDevice(state); // 获取当前连接的设备
    const api = getSelectedKeyboardAPI(state); // 获取键盘 API
    const selectedDefinition = getSelectedDefinition(state); // 获取选中的设备定义

    if (!connectedDevice || !keys || !selectedDefinition || !api) {
      return;
    }
    
    const selectedLayerIndex = getSelectedLayerIndex(state); // 获取选中的层索引
    const {path} = connectedDevice;
    const {row, col} = keys[keyIndex]; // 获取键对应的行和列
    await api.setKey(selectedLayerIndex, row, col, value); // 设置设备中的键值

    const {matrix} = selectedDefinition;
    const keymapIndex = row * matrix.cols + col; // 计算键映射中的索引

    dispatch(setKey({keymapIndex, value, devicePath: path})); // 分发更新键的动作
  };

// 选择器：获取键盘是否可选择的状态
export const getConfigureKeyboardIsSelectable = (state: RootState) =>
  state.keymap.configureKeyboardIsSelectable;
// 选择器：获取选中的键
export const getSelectedKey = (state: RootState) => state.keymap.selectedKey;
// 选择器：获取设备的原始层映射
export const getRawDeviceMap = (state: RootState) => state.keymap.rawDeviceMap;
// 选择器：获取层数
export const getNumberOfLayers = (state: RootState) =>
  state.keymap.numberOfLayers;
// 选择器：获取选中的层索引
export const getSelectedLayerIndex = (state: RootState) =>
  state.keymap.selectedLayerIndex;
// 选择器：获取选中的 256 色调色板颜色
export const getSelected256PaletteColor = (state: RootState) =>
  state.keymap.selectedPaletteColor;
// 选择器：将 256 色调色板转换为标准色调和饱和度
export const getSelectedPaletteColor = createSelector(
  getSelected256PaletteColor,
  ([hue, sat]) => {
    return [(360 * hue) / 255, sat / 255] as [number, number]; // 将 256 色转为标准色调和饱和度
  },
);

// 选择器：获取选中的设备层映射
export const getSelectedRawLayers = createSelector(
  getRawDeviceMap,
  getSelectedDevicePath,
  (rawDeviceMap, devicePath) => (devicePath && rawDeviceMap[devicePath]) || [],
);

// 选择器：获取加载进度
export const getLoadProgress = createSelector(
  getSelectedRawLayers,
  getNumberOfLayers,
  (layers, layerCount) =>
    layers && layers.filter((layer) => layer.isLoaded).length / layerCount, // 计算已加载层的比例
);

// 选择器：获取选中的层
export const getSelectedRawLayer = createSelector(
  getSelectedRawLayers,
  getSelectedLayerIndex,
  
  (deviceLayers, layerIndex) => deviceLayers && deviceLayers[layerIndex],
);

// 选择器：获取选中的键映射
export const getSelectedKeymaps = createSelector(
  getSelectedKeyDefinitions,
  getSelectedDefinition,
  getSelectedRawLayers,
  (keys, definition, layers) => {
    if (definition && layers) {
      const rawKeymaps = layers.map((layer) => layer.keymap); // 获取每层的原始键映射
      const {
        matrix: {cols},
      } = definition;
      return rawKeymaps.map((keymap) =>
        keys.map(({row, col}) => keymap[row * cols + col]), // 通过行列转换获取键值
      );
    }
    return undefined;
  },
);

// 选择器：获取当前选中层的键映射
export const getSelectedKeymap = createSelector(
  getSelectedKeymaps,
  getSelectedLayerIndex,
  (deviceLayers, layerIndex) =>  deviceLayers && deviceLayers[layerIndex],
);
export const getSelectedKeymapList = createSelector(
  getSelectedKeymaps,
  getSelectedLayerIndex,
  (deviceLayers, layerIndex) =>  deviceLayers && deviceLayers,
);
