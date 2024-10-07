import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit';
// 导入需要的 Redux 工具

import type {
  AuthorizedDevice,
  AuthorizedDevices,
  ConnectedDevices,
} from '../types/types'; // 导入设备相关的类型

import {
  bytesIntoNum,
  numIntoBytes,
  packBits,
  unpackBits,
} from '../utils/bit-pack'; // 导入用于字节和数字之间转换的工具

import {KeyboardValue} from '../utils/keyboard-api'; // 导入键盘值的相关常量

import type {
  DefinitionVersion,
  DefinitionVersionMap,
  KeyboardDictionary,
  VIADefinitionV2,
  VIADefinitionV3,
  VIAKey,
} from '@the-via/reader'; // 导入定义版本和键盘字典的类型

import type {AppThunk, RootState} from './index'; // 导入应用的类型

import {
  getSelectedDevicePath,
  getSelectedConnectedDevice,
  ensureSupportedIds,
  getSelectedKeyboardAPI,
} from './devicesSlice'; // 导入与设备相关的选择器

import {getMissingDefinition} from 'src/utils/device-store'; // 导入获取缺失定义的工具

import {getBasicKeyDict} from 'src/utils/key-to-byte/dictionary-store'; // 导入基本键字典工具

import {getByteToKey} from 'src/utils/key'; // 导入字节到键的转换工具

import {del, entries, setMany, update} from 'idb-keyval'; // 导入 IndexedDB 操作函数

import {isFulfilledPromise} from 'src/utils/type-predicates'; // 导入类型判断工具

import {extractDeviceInfo, logAppError} from './errorsSlice'; // 导入错误处理相关函数

// 布局选项的类型定义
type LayoutOption = number; 
type LayoutOptionsMap = {[devicePath: string]: LayoutOption[] | null}; // 设备路径映射到布局选项数组或 null

// 定义状态的类型
type DefinitionsState = {
  definitions: KeyboardDictionary; // 基本定义
  customDefinitions: KeyboardDictionary; // 自定义定义
  layoutOptionsMap: LayoutOptionsMap; // 布局选项映射
};

// 定义初始状态
const initialState: DefinitionsState = {
  definitions: {},
  customDefinitions: {},
  layoutOptionsMap: {},
};

// 创建 Redux slice
const definitionsSlice = createSlice({
  name: 'definitions',
  initialState,
  reducers: {
    // 更新基本定义的 reducer
    updateDefinitions: (state, action: PayloadAction<KeyboardDictionary>) => {
      state.definitions = {...state.definitions, ...action.payload}; // 合并新定义
    },
    // 加载初始自定义定义的 reducer
    loadInitialCustomDefinitions: (
      state,
      action: PayloadAction<KeyboardDictionary>,
    ) => {
      state.customDefinitions = action.payload; // 设置初始自定义定义
    },
    // 卸载自定义定义的 reducer
    unloadCustomDefinition: (
      state,
      action: PayloadAction<{
        id: number; // 自定义定义的 ID
        version: DefinitionVersion; // 版本
      }>,
    ) => {
      const {version, id} = action.payload; // 解构获取 version 和 id
      const definitionEntry = state.customDefinitions[id]; // 获取自定义定义条目
      if (Object.keys(definitionEntry).length === 1) {
        // 如果只有一个版本，直接删除
        delete state.customDefinitions[id];
        del(id); // 从存储中删除该条目
      } else {
        // 否则，删除指定版本
        delete definitionEntry[version];
        update(id, (d) => {
          delete d[version]; // 更新存储中的定义
          return d;
        });
      }
      state.customDefinitions = {...state.customDefinitions}; // 更新状态
    },
    // 加载自定义定义的 reducer
    loadCustomDefinitions: (
      state,
      action: PayloadAction<{
        definitions: (VIADefinitionV2 | VIADefinitionV3)[]; // 定义数组
        version: DefinitionVersion; // 版本
      }>,

    ) => {
      const {version, definitions} = action.payload; // 解构获取版本和定义
      definitions.forEach((definition) => {
        const definitionEntry =
          state.customDefinitions[definition.vendorProductId] ?? {}; // 获取或创建定义条目
        if (version === 'v2') {
          definitionEntry[version] = definition as VIADefinitionV2; // 设置 V2 定义
        } else {
          definitionEntry[version] = definition as VIADefinitionV3; // 设置 V3 定义
        }
        state.customDefinitions[definition.vendorProductId] = definitionEntry; // 更新状态
      });
    },
    // 更新布局选项的 reducer
    updateLayoutOptions: (state, action: PayloadAction<LayoutOptionsMap>) => {
      state.layoutOptionsMap = {...state.layoutOptionsMap, ...action.payload}; // 合并新布局选项
    },
  },
});

// 导出 actions
export const {
  loadCustomDefinitions,
  loadInitialCustomDefinitions,
  updateDefinitions,
  unloadCustomDefinition,
  updateLayoutOptions,
} = definitionsSlice.actions;

// 导出 reducer
export default definitionsSlice.reducer;

// 选择器：获取基本定义
export const getBaseDefinitions = (state: RootState) =>
  state.definitions.definitions;
// 选择器：获取自定义定义
export const getCustomDefinitions = (state: RootState) =>
  state.definitions.customDefinitions;
// 选择器：获取布局选项映射
export const getLayoutOptionsMap = (state: RootState) =>
  state.definitions.layoutOptionsMap;

// 选择器：获取合并后的定义
export const getDefinitions = createSelector(
  getBaseDefinitions,
  getCustomDefinitions,
  (definitions, customDefinitions) => {
    return Object.entries(customDefinitions).reduce(
      (p, [id, definitionMap]) => {
        return {...p, [id]: {...p[id], ...definitionMap}}; // 合并自定义定义
      },
      definitions, // 基本定义
    );
  },
);

// 选择器：获取选定的定义
export const getSelectedDefinition = createSelector(
  getDefinitions,
  getSelectedConnectedDevice,
  (definitions, connectedDevice) =>
    connectedDevice &&
    definitions &&
    definitions[connectedDevice.vendorProductId] &&
    definitions[connectedDevice.vendorProductId][
      connectedDevice.requiredDefinitionVersion
    ],
);

// 选择器：获取基本键到字节的映射
export const getBasicKeyToByte = createSelector(
  getSelectedConnectedDevice,
  (connectedDevice) => {
    const basicKeyToByte = getBasicKeyDict(
      connectedDevice ? connectedDevice.protocol : 0, // 获取基本键字典
    );
    return {basicKeyToByte, byteToKey: getByteToKey(basicKeyToByte)}; // 返回字典及其反向映射
  },
);

// 选择器：获取选定的布局选项
export const getSelectedLayoutOptions = createSelector(
  getSelectedDefinition,
  getLayoutOptionsMap,
  getSelectedDevicePath,
  (definition, map, path) =>
    (path && map[path]) || // 如果存在路径，则返回对应的选项
    (definition &&
      definition.layouts.labels &&
      definition.layouts.labels.map((_) => 0)) || // 否则返回默认值
    [],
);

// 选择器：获取选定的选项键
export const getSelectedOptionKeys = createSelector(
  getSelectedLayoutOptions,
  getSelectedDefinition,
  (layoutOptions, definition) =>
    (definition
      ? layoutOptions.flatMap(
          (option, idx) =>
            (definition.layouts.optionKeys[idx] &&
              definition.layouts.optionKeys[idx][option]) || // 获取对应的键
            [],
        )
      : []) as VIAKey[], // 如果没有定义，返回空数组
);

// 选择器：获取选定的键定义
export const getSelectedKeyDefinitions = createSelector(
  getSelectedDefinition,
  getSelectedOptionKeys,
  (definition, optionKeys) => {
    
    if (definition && optionKeys) {
      return definition.layouts.keys.concat(optionKeys); // 合并键定义
    }
    return []; // 返回空数组
  },
);

// 更新布局选项的 thunk
export const updateLayoutOption =
  (index: number, val: number): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const definition = getSelectedDefinition(state); // 获取选定的定义
    const api = getSelectedKeyboardAPI(state); // 获取键盘API
    const path = getSelectedDevicePath(state); // 获取设备路径

    if (!definition || !api || !path || !definition.layouts.labels) {
      return; // 如果没有必要的条件，直接返回
    }

    // 计算每个布局选项的数量
    const optionsNums = definition.layouts.labels.map((layoutLabel) =>
      Array.isArray(layoutLabel) ? layoutLabel.slice(1).length : 2,
    );

    // 复制现有选项以进行修改
    const options = [...getSelectedLayoutOptions(state)];
    options[index] = val; // 更新指定索引的选项

    const bytes = numIntoBytes(
      packBits(options.map((option, idx) => [option, optionsNums[idx]])), // 转换为字节
    );

    try {
      await api.setKeyboardValue(KeyboardValue.LAYOUT_OPTIONS, ...bytes); // 发送更新命令
    } catch {
      console.warn('设置布局选项命令未能工作'); // 处理错误
    }

    dispatch(
      updateLayoutOptions({
        [path]: options, // 更新 Redux 状态
      }),
    );
  };

// 存储自定义定义的 thunk
export const storeCustomDefinitions =
  ({
    definitions,
    version,
  }: {
    definitions: (VIADefinitionV2 | VIADefinitionV3)[]; // 自定义定义数组
    version: DefinitionVersion; // 版本
  }): AppThunk =>
  async (dispatch, getState) => {
    try {
      const allCustomDefinitions = getCustomDefinitions(getState()); // 获取所有自定义定义
      const entries = definitions.map((definition) => {
        return [
          definition.vendorProductId,
          {
            ...allCustomDefinitions[definition.vendorProductId],
            [version]: definition, // 更新定义
          },
        ] as [IDBValidKey, DefinitionVersionMap];
      });
      return setMany(entries); // 批量存储自定义定义
    } catch (e) {
      console.error(e); // 处理错误
      throw e; // 抛出错误
    }
  };

// 加载存储的自定义定义的 thunk
export const loadStoredCustomDefinitions =
  (): AppThunk => async (dispatch, getState) => {
    try {
      const dictionaryEntries: [string, DefinitionVersionMap][] =
        await entries(); // 获取存储中的所有条目
      const keyboardDictionary = dictionaryEntries
        .filter(([key]) => {
          return ['string', 'number'].includes(typeof key); // 过滤有效的键
        })
        .reduce((p, n) => {
          return {...p, [n[0]]: n[1]}; // 将条目转换为键盘字典
        }, {} as KeyboardDictionary);

      // 每个条目应为 [id, {v2:..., v3:...}]
      dispatch(loadInitialCustomDefinitions(keyboardDictionary)); // 加载初始自定义定义

      const [v2Ids, v3Ids] = dictionaryEntries.reduce(
        ([v2Ids, v3Ids], [entryId, definitionVersionMap]) => [
          definitionVersionMap.v2 ? [...v2Ids, Number(entryId)] : v2Ids,
          definitionVersionMap.v3 ? [...v3Ids, Number(entryId)] : v3Ids,
        ],

        [[] as number[], [] as number[]],
      );

      dispatch(ensureSupportedIds({productIds: v2Ids, version: 'v2'})); // 确保支持的 ID
      dispatch(ensureSupportedIds({productIds: v3Ids, version: 'v3'}));
    } catch (e) {
      console.error(e); // 处理错误
    }
  };

// 加载布局选项的 thunk
export const loadLayoutOptions = (): AppThunk => async (dispatch, getState) => {
  const state = getState();
  const selectedDefinition = getSelectedDefinition(state); // 获取选定的定义
  const connectedDevice = getSelectedConnectedDevice(state); // 获取选定的连接设备
  const api = getSelectedKeyboardAPI(state); // 获取键盘 API
  if (
    !connectedDevice ||
    !selectedDefinition ||
    !selectedDefinition.layouts.labels ||
    !api
  ) {
    return; // 检查必要条件
  }

  const {path} = connectedDevice; // 获取设备路径
  try {
    const res = await api.getKeyboardValue(KeyboardValue.LAYOUT_OPTIONS, [], 4); // 获取当前布局选项
    const options = unpackBits(
      bytesIntoNum(res), // 转换字节为数字
      selectedDefinition.layouts.labels.map((layoutLabel: string[] | string) =>
        Array.isArray(layoutLabel) ? layoutLabel.slice(1).length : 2,
      ),
    );
    dispatch(
      updateLayoutOptions({
        [path]: options, // 更新布局选项
      }),
    );
  } catch {
    console.warn('获取布局选项命令未能工作'); // 处理错误
  }
};

// 重新加载定义的 thunk
export const reloadDefinitions =
  (authorizedDevices: AuthorizedDevice[]): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const baseDefinitions = getBaseDefinitions(state); // 获取基本定义
    const definitions = getDefinitions(state); // 获取合并后的定义
    const missingDevicesToFetchDefinitions = authorizedDevices.filter(
      ({vendorProductId, requiredDefinitionVersion}) => {
        return (
          !definitions ||
          !definitions[vendorProductId] ||
          !definitions[vendorProductId][requiredDefinitionVersion] // 查找缺失的定义
        );
      },
    );

    const missingDefinitionsSettledPromises = await Promise.allSettled(
      missingDevicesToFetchDefinitions.map((device) =>
        getMissingDefinition(device, device.requiredDefinitionVersion), // 获取缺失定义的 promise
      ),
    );

    // 错误报告
    missingDefinitionsSettledPromises.forEach((settledPromise, i) => {
      const device = missingDevicesToFetchDefinitions[i];
      if (settledPromise.status === 'rejected') {
        const deviceInfo = extractDeviceInfo(device); // 提取设备信息
        dispatch(
          logAppError({
            message: `Fetching ${device.requiredDefinitionVersion} definition failed`, // 记录错误信息
            deviceInfo,
          }),
        );
      }
    });

    const missingDefinitions = missingDefinitionsSettledPromises
      .filter(isFulfilledPromise) // 过滤成功的请求
      .map((res) => res.value);

    if (!missingDefinitions.length) {
      return; // 如果没有缺失定义，直接返回
    }

    dispatch(
      updateDefinitions(
        missingDefinitions.reduce<KeyboardDictionary>(
          (p, [definition, version]) => ({
            ...p,
            [definition.vendorProductId]: {
              ...p[definition.vendorProductId],
              [version]: definition, // 更新定义
            },
          }),
          baseDefinitions,
        ),
      ),
    );
  };
