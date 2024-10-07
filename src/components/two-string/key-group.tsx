import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBasicKeyToByte } from 'src/store/definitionsSlice'; // 导入获取基本按键到字节的函数
import { useAppDispatch, useAppSelector } from 'src/store/hooks'; // 导入 Redux 的 hooks
import { getSelectedKey } from 'src/store/keymapSlice'; // 导入获取当前选择按键的函数
import { Keycap } from './unit-key/keycap'; // 导入按键帽组件
import {
  calculateKeyboardFrameDimensions, // 导入计算键盘框架尺寸的函数
  CSSVarObject, // 导入 CSS 变量对象
  getComboKeyProps, // 导入获取组合键属性的函数
} from 'src/utils/keyboard-rendering'; // 从 utils 中导入
import { getExpressions } from 'src/store/macrosSlice'; // 导入获取宏表达式的函数
import styled from 'styled-components'; // 导入 styled-components 用于样式处理
import { getSelectedTheme } from 'src/store/settingsSlice'; // 导入获取选定主题的函数
import { CaseInsideBorder } from './case'; // 导入键盘外壳的内边框常量
import {
  getKeycapSharedProps, // 导入获取按键帽共享属性的函数
  getKeysKeys, // 导入获取按键数据的函数
  getLabels, // 导入获取按键标签的函数
} from '../n-links/key-group'; // 从相关模块导入函数
import { KeyGroupProps, KeysKeys } from 'src/types/keyboard-rendering'; // 导入类型定义
import { getRGB } from 'src/utils/color-math'; // 导入获取 RGB 颜色的函数
import { Color } from 'three'; // 导入 Three.js 的 Color 类
import { useSkipFontCheck } from 'src/utils/use-skip-font-check'; // 导入字体检查的自定义 hook

// 定义键组容器的样式
const KeyGroupContainer = styled.div<{ height: number; width: number }>`
  position: absolute; // 绝对定位
  top: ${(p) => CaseInsideBorder * 1.5}px; // 上边距
  left: ${(p) => CaseInsideBorder * 1.5}px; // 左边距
`;

// 获取按键位置的函数
const getPosition = (x: number, y: number): [number, number, number] => [
  x - CSSVarObject.keyWidth / 2, // X 坐标偏移
  y - CSSVarObject.keyHeight / 2, // Y 坐标偏移
  0, // Z 坐标为 0
];

// 将按键颜色转换为 RGB 数组的函数
const getRGBArray = (keyColors: number[][]) => {
  console.log(keyColors);
  
  return keyColors.map(([hue, sat]) => {
    const rgbStr = getRGB({ // 将 HSL 转为 RGB
      hue: Math.round((255 * hue) / 360), // 计算色调
      sat: Math.round(255 * sat), // 计算饱和度
    });
    const srgbStr = `#${new Color(rgbStr).getHexString()}`; // 转为十六进制字符串
    const keyColor = { c: srgbStr, t: srgbStr }; // 定义颜色对象
    return keyColor; // 返回颜色对象
  });
};

// 定义 KeyGroup 组件
export const KeyGroup: React.FC<KeyGroupProps<React.MouseEvent>> = (props) => {
  const dispatch = useAppDispatch(); // 获取 Redux 的 dispatch 方法
  const selectedKey = useAppSelector(getSelectedKey); // 获取当前选中的按键
  const selectedTheme = useAppSelector(getSelectedTheme); // 获取当前选定主题
  const macroExpressions = useAppSelector(getExpressions); // 获取宏表达式
  const skipFontCheck = useSkipFontCheck(); // 使用自定义 hook 跳过字体检查

  // 获取按键颜色调色板，如果没有则使用选定主题
  // console.log(props.keyColors,'props.keyColors',selectedTheme);
  
  const keyColorPalette = props.keyColors
    ? getRGBArray(props.keyColors) // 如果提供了颜色，则转换为 RGB 数组
    : selectedTheme;

  const { basicKeyToByte, byteToKey } = useAppSelector(getBasicKeyToByte); // 获取基本按键到字节的映射
  const macros = useAppSelector((state) => state.macros); // 获取当前宏状态
  const { keys, selectedKey: externalSelectedKey } = props; // 从 props 解构 keys 和外部选中的按键

  // 确定选中的按键索引，优先使用外部传入的选中按键
  const selectedKeyIndex =
    externalSelectedKey === undefined ? selectedKey : externalSelectedKey;

  // 计算按键数据
  const keysKeys: KeysKeys<React.MouseEvent> = useMemo(() => {
    return getKeysKeys(props, keyColorPalette, dispatch, getPosition); // 生成按键数据
  }, [
    keys,
    keyColorPalette,
    props.onKeycapPointerDown, // 添加事件处理函数作为依赖
    props.onKeycapPointerOver,
  ]);

  // 计算按键标签
  const labels = useMemo(() => {
    return getLabels(props, macroExpressions, basicKeyToByte, byteToKey); // 生成按键标签
  }, [keys, props.matrixKeycodes, macros, props.definition]);

  // 计算键盘框架的宽度和高度
  const { width, height } = calculateKeyboardFrameDimensions(keys);
  
  // 渲染按键帽元素
  const elems = useMemo(() => {
  //  console.log(labels);
   
    
    return props.keys.map((k, i) => {
      
      return k.d ? null : ( // 如果按键有禁用标志，则返回 null
        <Keycap
          {...getComboKeyProps(k)} // 获取组合键的属性
          {...getKeycapSharedProps(
            k,
            i,
            props,
            keysKeys,
            selectedKeyIndex,
            labels,
            skipFontCheck, // 获取共享属性
          )}
        />
      );
    });
  }, [
    keys,
    selectedKeyIndex,
    labels,
    props.pressedKeys, // 添加 pressedKeys 作为依赖
    props.selectable, // 添加 selectable 作为依赖
    keyColorPalette, // 添加颜色调色板作为依赖
    props.definition.vendorProductId, // 添加产品 ID 作为依赖
    skipFontCheck, // 添加字体检查标志作为依赖
  ]);

  return (
    <KeyGroupContainer
      height={height} // 设置容器高度
      width={width} // 设置容器宽度
      style={{ pointerEvents: props.selectable ? 'all' : 'none' }} // 根据可选择性控制鼠标事件
    >
      {elems}   {/* 渲染按键帽元素 */}
    </KeyGroupContainer>
  );
};
