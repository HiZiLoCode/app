import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { getBasicKeyToByte } from 'src/store/definitionsSlice';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { getSelectedKey } from 'src/store/keymapSlice';
import { Keycap } from './unit-key/keycap';
import {
  calculateKeyboardFrameDimensions,
  CSSVarObject,
  KeycapMetric,
} from 'src/utils/keyboard-rendering';
import { getSelectedSRGBTheme } from 'src/store/settingsSlice';
import { ThreeEvent } from '@react-three/fiber';
import { getRGB } from 'src/utils/color-math';
import { Color } from 'three';
import glbSrc from 'assets/models/keyboard_components.glb';
import { getExpressions } from 'src/store/macrosSlice';
import {
  getKeycapSharedProps,
  getKeysKeys,
  getLabels,
} from '../n-links/key-group';
import { KeyGroupProps, KeysKeys } from 'src/types/keyboard-rendering';
import { useSkipFontCheck } from 'src/utils/use-skip-font-check';

// 将键颜色数组转换为 sRGB 颜色格式
const getSRGBArray = (keyColors: number[][]) => {
  return keyColors.map(([hue, sat]) => {
    const rgbStr = getRGB({
      hue: Math.round((255 * hue) / 360),
      sat: Math.round(255 * sat),
    });
    const srgbStr = `#${new Color(rgbStr)
      .convertSRGBToLinear()
      .getHexString()}`;
    const keyColor = { c: srgbStr, t: srgbStr };
    return keyColor;
  });
};

// 计算按键的位置
const getPosition = (x: number, y: number): [number, number, number] => [
  (KeycapMetric.keyXPos * x) / CSSVarObject.keyXPos,
  (-y * KeycapMetric.keyYPos) / CSSVarObject.keyYPos,
  0,
];

// 导出 KeyGroup 组件
export const KeyGroup: React.FC<KeyGroupProps<ThreeEvent<MouseEvent>>> = (
  props,
) => {
  
  // 使用 Redux 的 dispatch 方法
  const dispatch = useAppDispatch();

  // 加载键盘组件的 GLB 模型
  const keycapScene = useGLTF(glbSrc, true).scene;
 
  // 从 Redux store 中获取选定的按键和颜色主题
  const selectedKey = useAppSelector(getSelectedKey);
  const selectedSRGBTheme = useAppSelector(getSelectedSRGBTheme);
  const macroExpressions = useAppSelector(getExpressions); // 获取宏表达式
  const skipFontCheck = useSkipFontCheck(); // 跳过字体检查

  // 生成键颜色调色板，如果提供了自定义颜色，则转换为 sRGB 格式，否则使用选定的颜色主题
  const keyColorPalette = props.keyColors
    ? getSRGBArray(props.keyColors)
    : selectedSRGBTheme;

  // 从 Redux store 中获取键到字节和字节到键的映射
  const { basicKeyToByte, byteToKey } = useAppSelector(getBasicKeyToByte);
  const macros = useAppSelector((state) => state.macros); // 获取宏

  // 从 props 中提取键数据和选定的键
  const { keys, selectedKey: externalSelectedKey } = props;
  const selectedKeyIndex =
    externalSelectedKey === undefined ? selectedKey : externalSelectedKey;

  // 使用 useMemo 钩子计算键的键值和颜色
  const keysKeys: KeysKeys<ThreeEvent<MouseEvent>> = useMemo(() => {
    return getKeysKeys(props, keyColorPalette, dispatch, getPosition);
  }, [      
    keys,
    keyColorPalette,
    props.onKeycapPointerDown,
    props.onKeycapPointerOver,
  ]);

  // 使用 useMemo 钩子获取按键标签
  const labels = useMemo(() => {
    return getLabels(props, macroExpressions, basicKeyToByte, byteToKey);
  }, [keys, props.matrixKeycodes, macros, props.definition]);

  // 计算键盘的宽度和高度
  const { width, height } = calculateKeyboardFrameDimensions(keys);
  console.log(labels);
  
  
  // 渲染每个按键
  const elems = useMemo(() => {
    return props.keys.map((k, i) => {
      const { meshKey } = keysKeys.coords[i];
      return k.d ? null : (
        <Keycap
          // 获取键帽几何体
          keycapGeometry={
            (
              (keycapScene.getObjectByName(meshKey) as any) ||
              keycapScene.getObjectByName('K-R1-100')
            ).geometry
          }
          {...getKeycapSharedProps(
            k,
            i,
            props,
            keysKeys,
            selectedKeyIndex,
            labels,
            skipFontCheck,
          )}
        />
      );
    });
  }, [
    keys,
    selectedKeyIndex,
    labels,
    props.pressedKeys,
    props.selectable,
    keyColorPalette,
    props.definition.vendorProductId,
    skipFontCheck,
  ]);

  // 渲染包含所有按键的组
  return (
    <group
      scale={1}
      position={[
        // 计算键盘的位置，以确保按键组居中
        (-width * KeycapMetric.keyXPos + KeycapMetric.keyXSpacing) / 2,
        (KeycapMetric.keyYPos * height - KeycapMetric.keyYSpacing) / 2,
        0,
      ]}
    >
      {elems} {/* 渲染按键元素 */}
    </group>
  );
};
