import { useCallback, useContext, useEffect, useMemo } from 'react';
import { matrixKeycodes } from 'src/utils/key-event'; // 导入键盘事件相关的键码
import fullKeyboardDefinition from '../../utils/test-keyboard-definition.json'; // 导入完整的键盘定义数据
import { VIAKey, DefinitionVersionMap } from '@the-via/reader'; // 导入VIA键盘和定义版本映射的类型
import { useAppDispatch, useAppSelector } from 'src/store/hooks'; // 自定义 hooks，用于访问 Redux store
import {
  getSelectedKeyDefinitions,
  getSelectedDefinition,
  getCustomDefinitions,
} from 'src/store/definitionsSlice'; // 从 Redux store 获取选定的键定义和自定义定义
import type { VIADefinitionV2, VIADefinitionV3 } from '@the-via/reader'; // 类型定义
import {
  getSelectedKeymap,
  getSelectedKeymapList,
  getSelectedPaletteColor,
  setLayer,
} from 'src/store/keymapSlice'; // 从 Redux store 获取选定的键图和调色板颜色，并设置图层
import { KeyboardCanvas as StringKeyboardCanvas } from '../two-string/keyboard-canvas'; // 导入2D键盘画布组件
import { KeyboardCanvas as FiberKeyboardCanvas } from '../three-fiber/keyboard-canvas'; // 导入3D键盘画布组件
import { useLocation } from 'wouter'; // 导入路由位置 hook
import {
  getSelectedConnectedDevice,
  getSelectedKeyboardAPI,
} from 'src/store/devicesSlice'; // 从 Redux store 获取选定的连接设备和键盘 API
import {
  getDesignDefinitionVersion,
  getIsTestMatrixEnabled,
  getTestKeyboardSoundsSettings,
  setTestMatrixEnabled,
} from 'src/store/settingsSlice'; // 从 Redux store 获取设计定义版本、测试矩阵状态和测试键盘声音设置
import {
  getDesignSelectedOptionKeys,
  getSelectedDefinitionIndex,
  getShowMatrix,
} from 'src/store/designSlice'; // 从 Redux store 获取设计选择的选项键、选定的定义索引和显示矩阵设置
import { useGlobalKeys } from 'src/utils/use-global-keys'; // 自定义 hook，用于处理全局按键
import { useMatrixTest } from 'src/utils/use-matrix-test'; // 自定义 hook，用于处理矩阵测试
import { TestContext } from '../panes/test'; // 导入测试上下文
import { TestKeyState } from 'src/types/types'; // 测试键状态类型定义
import { useColorPainter } from 'src/utils/use-color-painter'; // 自定义 hook，用于处理颜色绘制
import { getShowKeyPainter } from 'src/store/menusSlice'; // 从 Redux store 获取是否显示键绘制器的设置
import { TestKeyboardSounds } from 'src/components/void/test-keyboard-sounds'; // 导入测试键盘声音组件
import { DisplayMode, NDimension } from 'src/types/keyboard-rendering'; // 键盘渲染的显示模式和维度类型
import { getKeyboardRowPartitions } from 'src/utils/keyboard-rendering'; // 自定义工具函数，用于获取键盘行分区

// 根据维度选择键盘画布组件
const getKeyboardCanvas = (dimension: '2D' | '3D') =>
  dimension === '2D' ? StringKeyboardCanvas : FiberKeyboardCanvas;

export const ConfigureKeyboard = (props: {
  selectable?: boolean; // 是否可选择
  dimensions?: DOMRect; // 键盘的尺寸
  nDimension: NDimension; // 键盘的维度类型
}) => {
  const { selectable, dimensions } = props;
  
  // 从 Redux 状态中获取选定的键图
  const matrixKeycodes = useAppSelector(
    (state) => getSelectedKeymap(state) || [],
  );

  const matrixKeycodesList = useAppSelector(
    (state) => getSelectedKeymapList(state) || [],
  );
  console.log(matrixKeycodesList);
  
  // 从 Redux 状态中获取选定的键定义
  const keys: (VIAKey & { ei?: number })[] = useAppSelector(
    getSelectedKeyDefinitions,
  );

  // 从 Redux 状态中获取选定的键盘定义
  const definition = useAppSelector(getSelectedDefinition);
  
  // 获取是否显示键绘制器的设置
  const showKeyPainter = useAppSelector(getShowKeyPainter);
  
  // 获取选定的调色板颜色
  const selectedPaletteColor = useAppSelector(getSelectedPaletteColor);

  // 使用颜色绘制器来处理键盘的颜色
  const { keyColors, onKeycapPointerDown, onKeycapPointerOver } = useColorPainter(
    keys,
    selectedPaletteColor,
  );

  // 归一化键和颜色，过滤掉没有颜色的键
  const [normalizedKeys, normalizedColors] = useMemo(() => {
    return keyColors && keys
      ? [
          keys.filter((_, i) => keyColors[i] && keyColors[i].length), // 过滤有颜色的键
          keyColors.filter((i) => i && i.length), // 过滤有颜色的数组
        ]
      : [null, null];
  }, [keys, keyColors]);

  // 如果没有定义或尺寸，则返回 null
  if (!definition || !dimensions) {
    return null; 
  }

  // 选择对应的键盘画布组件
  
  const KeyboardCanvas = getKeyboardCanvas(props.nDimension);  
  return (
    <>
      {/* 渲染键盘画布，传入必要的属性 */}
      <KeyboardCanvas
        matrixKeycodes={matrixKeycodes}
        matrixKeycodesList={matrixKeycodesList}
        keys={keys}
        selectable={!!selectable}
        definition={definition}
        containerDimensions={dimensions}
        mode={DisplayMode.Configure}
        shouldHide={showKeyPainter}
      />
      {/* 如果存在归一化的键和颜色，则渲染另一个键盘画布 */}
      {normalizedKeys &&
      normalizedKeys.length &&
      normalizedColors &&
      normalizedColors.length ? (
        <KeyboardCanvas
          matrixKeycodes={matrixKeycodes}
          matrixKeycodesList={matrixKeycodesList}
          keys={normalizedKeys}
          selectable={showKeyPainter}
          definition={definition}
          containerDimensions={dimensions}
          mode={DisplayMode.ConfigureColors}
          keyColors={normalizedColors}
          onKeycapPointerDown={onKeycapPointerDown}
          onKeycapPointerOver={onKeycapPointerOver}
          shouldHide={!showKeyPainter}
        />
      ) : null}
    </>
  );
};


const TestKeyboard = (props: {
  selectable?: boolean;
  containerDimensions?: DOMRect;
  pressedKeys?: TestKeyState[];
  matrixKeycodes: number[];
  keys: (VIAKey & { ei?: number })[];
  definition: VIADefinitionV2 | VIADefinitionV3;
  nDimension: NDimension;
}) => {
  const {
    selectable,
    containerDimensions,
    matrixKeycodes,
    keys,
    pressedKeys,
    definition,
    nDimension,
  } = props;

  // 如果容器的尺寸未定义，则不渲染任何内容
  if (!containerDimensions) {
    return null;
  }

  // 选择适当的键盘画布组件（2D 或 3D）
  const KeyboardCanvas = getKeyboardCanvas(nDimension);

  return (
    <KeyboardCanvas
      matrixKeycodes={matrixKeycodes}   // 键盘的矩阵键码
      keys={keys}                       // 键的定义
      selectable={!!selectable}         // 是否允许选择键
      definition={definition}           // 键盘的定义
      pressedKeys={pressedKeys}         // 当前被按下的键
      containerDimensions={containerDimensions}  // 画布容器的尺寸
      mode={DisplayMode.Test}           // 渲染模式，测试模式
    />
  );
};


const DesignKeyboard = (props: {
  containerDimensions?: DOMRect;
  definition: VIADefinitionV2 | VIADefinitionV3;
  showMatrix?: boolean;
  selectedOptionKeys: number[];
  nDimension: NDimension;
}) => {
  const { containerDimensions, showMatrix, definition, selectedOptionKeys } = props;
  const { keys, optionKeys } = definition.layouts;

  // 如果容器的尺寸未定义，则不渲染任何内容
  if (!containerDimensions) {
    return null;
  }

  // 使用 `useMemo` 来优化性能，计算显示的选项键
  const displayedOptionKeys = useMemo(
    () =>
      optionKeys
        ? Object.entries(optionKeys).flatMap(([key, options]) => {
            const optionKey = parseInt(key);

            // 如果选项键已被选择，则使用已选择的选项
            return selectedOptionKeys[optionKey]
              ? options[selectedOptionKeys[optionKey]]
              : options[0];
          })
        : [],
    [optionKeys, selectedOptionKeys],
  );

  // 计算最终要显示的键
  const displayedKeys = useMemo(() => {
    return [...keys, ...displayedOptionKeys];
  }, [keys, displayedOptionKeys]);

  // 选择适当的键盘画布组件（2D 或 3D）
  const KeyboardCanvas = getKeyboardCanvas(props.nDimension);

  return (
    <KeyboardCanvas
      matrixKeycodes={EMPTY_ARR}          // 空的矩阵键码数组
      keys={displayedKeys}                // 需要显示的键
      selectable={false}                 // 不允许选择键
      definition={definition}            // 键盘的定义
      containerDimensions={containerDimensions}  // 画布容器的尺寸
      mode={DisplayMode.Design}          // 渲染模式，设计模式
      showMatrix={showMatrix}            // 是否显示矩阵
    />
  );
};


export const Design = (props: {
  dimensions?: DOMRect;
  nDimension: NDimension;
}) => {
  // 从 Redux store 获取本地定义、设计定义版本、选定定义索引、选择的选项键和是否显示矩阵
  const localDefinitions = Object.values(useAppSelector(getCustomDefinitions));
  const definitionVersion = useAppSelector(getDesignDefinitionVersion);
  const selectedDefinitionIndex = useAppSelector(getSelectedDefinitionIndex);
  const selectedOptionKeys = useAppSelector(getDesignSelectedOptionKeys);
  const showMatrix = useAppSelector(getShowMatrix);

  // 计算版本定义
  const versionDefinitions: DefinitionVersionMap[] = useMemo(
    () =>
      localDefinitions.filter(
        (definitionMap) => definitionMap[definitionVersion],
      ),
    [localDefinitions, definitionVersion],
  );

  // 选择当前定义
  const definition =
    versionDefinitions[selectedDefinitionIndex] &&
    versionDefinitions[selectedDefinitionIndex][definitionVersion];

  return (
    definition && (
      <DesignKeyboard
        containerDimensions={props.dimensions}
        definition={definition}
        selectedOptionKeys={selectedOptionKeys}
        showMatrix={showMatrix}
        nDimension={props.nDimension}
      />
    )
  );
};

const EMPTY_ARR = [] as any[];
export const Test = (props: { dimensions?: DOMRect; nDimension: NDimension }) => {
  // 从 Redux store 获取 dispatch 函数，用于分发 actions
  const dispatch = useAppDispatch(); 

  // 使用路由 hook 获取当前路径
  const [path] = useLocation(); 

  // 判断当前路径是否为测试页面
  const isShowingTest = path === '/test'; 

  // 从 Redux store 获取选定的键盘 API
  const api = useAppSelector(getSelectedKeyboardAPI); 

  // 从 Redux store 获取选定的连接设备
  const device = useAppSelector(getSelectedConnectedDevice); 

  // 从 Redux store 获取选定的键盘定义
  const selectedDefinition = useAppSelector(getSelectedDefinition); 

  // 从 Redux store 获取选定的键定义
  const keyDefinitions = useAppSelector(getSelectedKeyDefinitions); 

  // 从 Redux store 检查测试矩阵是否启用
  const isTestMatrixEnabled = useAppSelector(getIsTestMatrixEnabled); 

  // 从 Redux store 获取测试键盘声音设置
  const testKeyboardSoundsSettings = useAppSelector(getTestKeyboardSoundsSettings); 

  // 从 Redux store 获取选定的矩阵键码
  const selectedMatrixKeycodes = useAppSelector(
    (state) => getSelectedKeymap(state) || []
  ); 

  // 使用自定义 hook 管理全局按键状态
  const [globalPressedKeys, setGlobalPressedKeys] = useGlobalKeys(
    !isTestMatrixEnabled && isShowingTest
  ); 

  // 使用自定义 hook 管理矩阵按键状态
  const [matrixPressedKeys, setMatrixPressedKeys] = useMatrixTest(
    isTestMatrixEnabled && isShowingTest,
    api as any,
    device as any,
    selectedDefinition as any
  ); 

  // 清除测试按键的回调函数
  const clearTestKeys = useCallback(() => {
    setGlobalPressedKeys(EMPTY_ARR);
    setMatrixPressedKeys(EMPTY_ARR);
  }, [setGlobalPressedKeys, setMatrixPressedKeys]); 
  
  // 使用上下文获取测试上下文并更新清除测试键函数
  const testContext = useContext(TestContext);
  useEffect(() => {
    if (testContext[0].clearTestKeys !== clearTestKeys) {
      testContext[1]({ clearTestKeys });
    }
  }, [testContext, clearTestKeys]);

  // 路径变化时，禁用测试矩阵并清除测试键
  useEffect(() => {
    if (path !== '/test') {
      dispatch(setTestMatrixEnabled(false));
      testContext[0].clearTestKeys();
    }
    if (path !== '/') {
      dispatch(setLayer(0));
    }
  }, [path]);

  // 根据测试矩阵是否启用映射矩阵按键状态
  const matrixPressedKeysMapped =
    isTestMatrixEnabled && keyDefinitions
      ? keyDefinitions.map(
          ({ row, col }: { row: number; col: number }) =>
            selectedDefinition &&
            matrixPressedKeys[
              (row * selectedDefinition.matrix.cols +
                col) as keyof typeof matrixPressedKeys
            ]
        )
      : []; 
  
  // 根据测试矩阵状态选择测试定义和键
  const testDefinition = isTestMatrixEnabled
    ? selectedDefinition
    : fullKeyboardDefinition;
  const testKeys = isTestMatrixEnabled
    ? keyDefinitions
    : fullKeyboardDefinition.layouts.keys;

  if (!testDefinition || typeof testDefinition === 'string') {
    return null; // 如果定义无效或类型错误，返回 null
  }

  // 根据测试矩阵状态选择按键状态
  const testPressedKeys = isTestMatrixEnabled
    ? (matrixPressedKeysMapped as TestKeyState[])
    : (globalPressedKeys as TestKeyState[]);

  // 使用自定义工具函数获取键盘行分区
  const { partitionedKeys } = useMemo(
    () => getKeyboardRowPartitions(testKeys as VIAKey[]),
    [testKeys]
  );

  // 根据测试矩阵状态处理按键状态
  const testPressedKeys2 = isTestMatrixEnabled
    ? (matrixPressedKeys as TestKeyState[])
    : (globalPressedKeys as TestKeyState[]);

  // 按行分区按键状态
  const partitionedPressedKeys: TestKeyState[][] = partitionedKeys.map(
    (rowArray) => {
      return rowArray.map(
        ({ row, col }: { row: number; col: number }) =>
          testPressedKeys2[
            (row * testDefinition.matrix.cols + col) as keyof typeof testPressedKeys2
          ]
      ) as TestKeyState[];
    }
  );

  return (
    <>
      {/* 渲染测试键盘组件 */}
      <TestKeyboard
        definition={testDefinition as VIADefinitionV2}
        keys={testKeys as VIAKey[]}
        pressedKeys={testPressedKeys}
        matrixKeycodes={
          isTestMatrixEnabled ? selectedMatrixKeycodes : matrixKeycodes
        }
        containerDimensions={props.dimensions}
        nDimension={props.nDimension}
      />
      {/* 如果启用了测试键盘声音设置，则渲染测试键盘声音组件 */}
      {partitionedPressedKeys && testKeyboardSoundsSettings.isEnabled && (
        <TestKeyboardSounds pressedKeys={partitionedPressedKeys} />
      )}
    </>
  );
};

