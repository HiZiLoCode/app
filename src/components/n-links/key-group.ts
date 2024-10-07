import {getBoundingBox, Result, VIAKey} from '@the-via/reader';
import {useAppDispatch} from 'src/store/hooks';
import {updateSelectedKey} from 'src/store/keymapSlice';
import {
  KeycapSharedProps,
  KeyGroupProps,
  KeysKeys,
} from 'src/types/keyboard-rendering';
import {getByteToKey} from 'src/utils/key';
import {getBasicKeyDict} from 'src/utils/key-to-byte/dictionary-store';
import {
  calculatePointPosition,
  getKeyboardRowPartitions,
  getKeyId,
  getLabel,
  getMeshName,
  getScale,
  KeycapMetric,
} from 'src/utils/keyboard-rendering';

// 获取按键的共享属性，用于按键的渲染和交互处理
export function getKeycapSharedProps<T> (
  k: VIAKey, // 当前按键对象，包含按键的位置信息、宽高等属性
  i: number, // 按键的索引，用于在按键数组中定位当前按键
  props: KeyGroupProps<T>, // 包含按键组的属性，如模式、按压状态等
  keysKeys: KeysKeys<T>, // 包含按键的坐标、旋转、缩放等信息
  selectedKeyIndex: number | null, // 当前被选中的按键索引，如果没有则为 null
  labels: any[], // 按键的标签数组，每个按键可能有不同的标签
  skipFontCheck: boolean, // 是否跳过字体检查的标志
): KeycapSharedProps<T> {
  
  // 从 keysKeys 对象中提取当前按键索引对应的属性
  const {
    position, // 按键的位置
    rotation, // 按键的旋转角度
    scale, // 按键的缩放比例
    color, // 按键的颜色
    idx, // 按键的索引值
    onClick, // 按键点击事件的处理函数
    onPointerDown, // 按键按下事件的处理函数
    onPointerOver, // 按键悬停事件的处理函数
  } = keysKeys.coords[i]; // 从按键坐标数组中获取第 i 个按键的属性

  // 输出 keysKeys 坐标数据和当前按键的标签，供调试使用
  // console.log(keysKeys.coords, labels[i], 'keysKeys');
  
  // 判断当前按键是否为旋钮（编码器），通过检查 'ei' 属性是否定义
  const isEncoder = k['ei'] !== undefined;

  // 返回包含按键共享属性的对象，用于按键的渲染和交互
  return {
    mode: props.mode, // 按键的模式属性，通常决定按键的行为
    position: position, // 按键的位置
    rotation: rotation, // 按键的旋转角度
    scale: getScale(k, scale), // 按键的缩放比例，调用 getScale 函数根据按键计算
    textureWidth: k.w, // 按键的宽度，用于纹理贴图
    textureHeight: k.h, // 按键的高度，用于纹理贴图
    textureOffsetX: !!k.w2 ? Math.abs(k.w2 - k.w) : 0, // 如果有第二个宽度 w2，计算 X 方向上的纹理偏移
    color: color, // 按键的颜色
    shouldRotate: isEncoder, // 如果按键是编码器，设置 shouldRotate 为 true
    onPointerDown: onPointerDown, // 按键按下时的事件处理函数
    onPointerOver: onPointerOver, // 按键悬停时的事件处理函数
    keyState: props.pressedKeys ? props.pressedKeys[i] : -1, // 按键的按压状态，如果存在则从 pressedKeys 获取
    disabled: !props.selectable, // 如果按键不可选择，设置为禁用
    selected: i === selectedKeyIndex, // 如果按键是当前选中的按键，设置为选中状态
    idx: idx, // 按键的索引值
    label: labels[i], // 按键的标签，通常显示在按键上
    onClick: onClick, // 按键点击事件的处理函数
    key: keysKeys.indices[i], // 按键的唯一标识符
    skipFontCheck, // 是否跳过字体检查
  };
}


const getKeysKeysIndices =(vendorProductId: number) => (k: VIAKey, i: number) => {
    const isEncoder = k['ei'] !== undefined;
    return `${vendorProductId}-${i}-${k.w}-${k.h}-${isEncoder}`;
  };

export function getLabels<T>(
  props: KeyGroupProps<T>,
  macroExpressions: string[],
  basicKeyToByte: ReturnType<typeof getBasicKeyDict>,
  byteToKey: ReturnType<typeof getByteToKey>,
) {
  return !props.matrixKeycodes.length
    ? []
    : props.keys.map((k, i) =>
      getLabel(
        props.matrixKeycodes[i],
        props.matrixKeycodesList? props.matrixKeycodesList.map(item=>item[i]) : [],
        k.w,
        macroExpressions,
        props.definition,
        basicKeyToByte,
        byteToKey,
      ),
    );
}

export function getKeysKeys<T>(
  props: KeyGroupProps<T>,
  keyColorPalette: any,
  dispatch: ReturnType<typeof useAppDispatch>,
  getPosition: (x: number, y: number) => [number, number, number],
): KeysKeys<T> {
  const {keys} = props;
  const {rowMap} = getKeyboardRowPartitions(keys);
  const boxes = (keys as unknown as Result[]).map(getBoundingBox);
  const [minX, minY] = [
    Math.min(...boxes.map((p) => p.xStart)),
    Math.min(...boxes.map((p) => p.yStart)),
  ];
  const positions = keys
    .map((k) => {
      const key = {...k};
      if (minX < 0) {
        key.x = key.x - minX;
      }
      if (minY < 0) {
        key.y = key.y - minY;
      }
      return key;
    })
    .map(calculatePointPosition);
  return {
    indices: keys.map(getKeysKeysIndices(props.definition.vendorProductId)),
    coords: keys.map((k, i) => {
      // x & y are pixel positioned
      const [x, y] = positions[i];
      const r = (k.r * (2 * Math.PI)) / 360;
      // The 1.05mm in-between keycaps but normalized by a keycap width/height
      const normalizedKeyXSpacing =
        KeycapMetric.keyXSpacing / KeycapMetric.keyWidth;
      const normalizedKeyYSpacing =
        KeycapMetric.keyYSpacing / KeycapMetric.keyHeight;
      const normalizedWidth =
        (1 + normalizedKeyXSpacing) * (k.w2 || k.w) - normalizedKeyXSpacing;
      const normalizedHeight =
        k.h * (1 + normalizedKeyYSpacing) - normalizedKeyYSpacing;
      const meshKey = getMeshName(k, rowMap[getKeyId(k)], false);
      const paletteKey = props.keyColors ? i : k.color;
      const color = (keyColorPalette as any)[paletteKey];

      return {
        position: getPosition(x + minX, y + minY),
        rotation: [0, 0, -r],
        scale: [normalizedWidth, normalizedHeight, 1],
        color,
        meshKey,
        idx: i,
        onClick: (evt: any, idx: number) => {
          evt.stopPropagation();
          dispatch(updateSelectedKey(idx));
        },
        onPointerDown: props.onKeycapPointerDown,
        onPointerOver: props.onKeycapPointerOver,
      };
    }),
  };
}
