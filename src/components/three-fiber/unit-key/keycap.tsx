import {animated, useSpring} from '@react-spring/three';
import {Html} from '@react-three/drei';
import {ThreeEvent} from '@react-three/fiber';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {shallowEqual} from 'react-redux';
import {
  DisplayMode,
  KeycapState,
  ThreeFiberKeycapProps,
} from 'src/types/keyboard-rendering';
import {TestKeyState} from 'src/types/types';
import * as THREE from 'three';
import {KeycapTooltip} from '../../inputs/tooltip';

// 获取宏数据，优先使用宏表达式，其次使用标签
const getMacroData = ({
  macroExpression,
  label,
}: {
  macroExpression?: string;
  label: string;
}) =>
  label && label.length > 15
    ? label
    : macroExpression && macroExpression.length
    ? macroExpression
    : null;

/**
 * 在画布上绘制背景和前景图形，用于编码显示
 * 
 * @param canvas - 需要绘制的 HTML 画布元素
 * @param [widthMultiplier, heightMultiplier] - 画布的宽度和高度缩放因子
 * @param bgColor - 背景颜色
 * @param fgColor - 前景颜色
 */
const paintEncoder = (
  canvas: HTMLCanvasElement,
  [widthMultiplier, heightMultiplier]: [number, number],
  bgColor: string,
  fgColor: string,
) => {
  // DPI（每英寸点数），默认为 1
  const dpi = 1;
  // 画布的基础尺寸
  const canvasSize = 512 * dpi;
  // 根据缩放因子计算画布的实际宽度和高度
  const [canvasWidth, canvasHeight] = [
    canvasSize * widthMultiplier,
    canvasSize * heightMultiplier,
  ];
  // 设置画布的宽度和高度
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  // 获取 2D 绘图上下文
  const context = canvas.getContext('2d');
  // 工作区域的分割因子
  const workingAreaDivider = 2.6;

  if (context) {
    // 绘制背景
    context.fillStyle = bgColor; // 设置填充颜色为背景颜色
    context.clearRect(0, 0, canvas.width, canvas.height); // 清除画布上的所有内容
    context.fillRect(0, 0, canvas.width, canvas.height); // 绘制背景矩形
    context.fill(); // 填充矩形

    // 绘制前景图形
    context.fillStyle = fgColor; // 设置填充颜色为前景颜色
    // 计算椭圆的半径
    const rad = (0.4 * canvasWidth) / workingAreaDivider;
    // 绘制椭圆
    context.ellipse(
      (0.5 * canvasWidth) / workingAreaDivider, // 椭圆中心的 x 坐标
      (2.1 * canvasHeight) / workingAreaDivider, // 椭圆中心的 y 坐标
      rad, // 椭圆的水平半径
      rad, // 椭圆的垂直半径
      Math.PI / 4, // 椭圆的旋转角度（以弧度为单位）
      0, // 起始角度（以弧度为单位）
      2 * Math.PI, // 结束角度（以弧度为单位），表示完整的椭圆
    );
    context.fill(); // 填充椭圆
  }
};


// 定义点和矩形类型
type Point = {
  x: number;
  y: number;
};

type Rect = {
  bl: Point;
  tr: Point;
};

// 在画布上绘制调试线条
const paintDebugLines = (
  canvas: HTMLCanvasElement,
  keycapRect: Rect,
  faceRect: Rect,
) => {
  const context = canvas.getContext('2d');
  if (context == null) {
    return;
  }
  context.strokeStyle = 'magenta';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(
    keycapRect.bl.x * canvas.width,
    (1 - keycapRect.bl.y) * canvas.height,
  );
  context.lineTo(
    keycapRect.bl.x * canvas.width,
    (1 - keycapRect.tr.y) * canvas.height,
  );
  context.lineTo(
    keycapRect.tr.x * canvas.width,
    (1 - keycapRect.tr.y) * canvas.height,
  );
  context.lineTo(
    keycapRect.tr.x * canvas.width,
    (1 - keycapRect.bl.y) * canvas.height,
  );
  context.lineTo(
    keycapRect.bl.x * canvas.width,
    (1 - keycapRect.bl.y) * canvas.height,
  );
  context.stroke();
  context.beginPath();
  context.moveTo(
    faceRect.bl.x * canvas.width,
    (1 - faceRect.bl.y) * canvas.height,
  );
  context.lineTo(
    faceRect.bl.x * canvas.width,
    (1 - faceRect.tr.y) * canvas.height,
  );
  context.lineTo(
    faceRect.tr.x * canvas.width,
    (1 - faceRect.tr.y) * canvas.height,
  );
  context.lineTo(
    faceRect.tr.x * canvas.width,
    (1 - faceRect.bl.y) * canvas.height,
  );
  context.lineTo(
    faceRect.bl.x * canvas.width,
    (1 - faceRect.bl.y) * canvas.height,
  );
  context.stroke();
};

// 在画布上绘制按键标签
const paintKeycapLabel = (
  canvas: HTMLCanvasElement,
  rect: Rect,
  legendColor: string,
  label: any,
) => {
  const context = canvas.getContext('2d');
  if (context == null) {
    return;
  }
  const fontFamily =
    'Fira Sans, Arial Rounded MT, Arial Rounded MT Bold, Arial';
  // 从面部边缘到文本绘制位置的边距
  const margin = {x: 0.015, y: 0.02};
  const centerLabelMargin = {x: 0.01, y: -0.01};
  const singleLabelMargin = {x: 0.01, y: 0.02};

  // 定义面部的剪切路径，防止文本绘制在侧面上
  context.beginPath();
  context.moveTo(rect.bl.x * canvas.width, (1 - rect.bl.y) * canvas.height);
  context.lineTo(rect.bl.x * canvas.width, (1 - rect.tr.y) * canvas.height);
  context.lineTo(rect.tr.x * canvas.width, (1 - rect.tr.y) * canvas.height);
  context.lineTo(rect.tr.x * canvas.width, (1 - rect.bl.y) * canvas.height);
  context.lineTo(rect.bl.x * canvas.width, (1 - rect.bl.y) * canvas.height);
  context.clip();

  context.fillStyle = legendColor;
  if (label === undefined) {
  } else if (label.topLabel && label.bottomLabel) {
    let fontSize = 52;
    let fontHeightTU = (0.75 * fontSize) / canvas.height;
    let topLabelOffset = label.offset[0] * fontHeightTU;
    let bottomLabelOffset = label.offset[1] * fontHeightTU;
    context.font = `bold ${fontSize}px ${fontFamily}`;
    context.fillText(
      label.topLabel,
      (rect.bl.x + margin.x) * canvas.width,
      (1 - (rect.tr.y - fontHeightTU - margin.y - topLabelOffset)) *
        canvas.height,
    );
    context.fillText(
      label.bottomLabel,
      (rect.bl.x + margin.x) * canvas.width,
      (1 - (rect.bl.y + margin.y + bottomLabelOffset)) * canvas.height,
    );
  } else if (label.centerLabel) {
    let fontSize = 37.5 * label.size;
    let fontHeightTU = (0.75 * fontSize) / canvas.height;
    let faceMidLeftY = (rect.tr.y + rect.bl.y) / 2;
    context.font = `bold ${fontSize}px ${fontFamily}`;
    context.fillText(
      label.label,
      (rect.bl.x + centerLabelMargin.x) * canvas.width,
      (1 - (faceMidLeftY - 0.5 * fontHeightTU - centerLabelMargin.y)) *
        canvas.height,
    );
    // 如果标签超出范围，返回 true
    return (
      context.measureText(label.centerLabel).width >
      (rect.tr.x - (rect.bl.x + centerLabelMargin.x)) * canvas.width
    );
  } else if (typeof label.label === 'string') {
    let fontSize = 75;
    let fontHeightTU = (0.75 * fontSize) / canvas.height;
    context.font = `bold ${fontSize}px ${fontFamily}`;
    context.fillText(
      label.label,
      (rect.bl.x + singleLabelMargin.x) * canvas.width,
      (1 - (rect.tr.y - fontHeightTU - singleLabelMargin.y)) * canvas.height,
    );
  }
};

// 计算纹理坐标的矩形区域
type TextureRects = {
  keycapRect: Rect;
  faceRect: Rect;
};

const calculateTextureRects = (
  widthMultiplier: number,
  heightMultiplier: number,
  textureWidth: number,
  textureHeight: number,
  textureOffsetX: number,
): TextureRects => {
  // 纹理坐标 (UV) 映射中的常量
  const size1u = 1 / 2.6;
  const unitScale = 19.05;
  const offsetToCorner = 0.445;
  const gap = (offsetToCorner / unitScale) * size1u;

  // 纹理宽度和高度是按键帽在 U 中的大小
  // 将其裁剪为 2.75U，因为纹理坐标 (UV) 仅覆盖 2.6U
  let keycapWidth = Math.min(2.75, textureWidth);
  let keycapHeight = Math.min(2.75, textureHeight);

  // 如果模型是“拉伸”的 1U 按键，
  // 认为它是 1U 按键，因为纹理坐标 (UV) 将用于 1U 按键。
  if (widthMultiplier > 1 || heightMultiplier > 1) {
    keycapWidth = 1;
    keycapHeight = 1;
  }

  let keycapRect: Rect = {
    bl: {x: gap, y: gap},
    tr: {x: keycapWidth * size1u - gap, y: keycapHeight * size1u - gap},
  };

  let faceRect: Rect = {
    bl: {x: keycapRect.bl.x + 0.07, y: keycapRect.bl.y + 0.08},
    tr: {x: keycapRect.tr.x - 0.07, y: keycapRect.tr.y - 0.0146},
  };

  // textureOffsetX 是按键帽形状的左边缘到狭窄部分的 X 偏移量
  if (textureOffsetX > 0) {
    faceRect.bl.x += textureOffsetX * size1u;
    faceRect.tr.x += textureOffsetX * size1u;
    keycapRect.bl.x += textureOffsetX * size1u;
    keycapRect.tr.x += textureOffsetX * size1u;
  }

  return {keycapRect, faceRect};
};

// 在画布上绘制按键帽
const paintKeycap = (
  canvas: HTMLCanvasElement,
  [widthMultiplier, heightMultiplier]: [number, number],
  textureWidth: number,
  textureHeight: number,
  bgColor: string,
  legendColor: string,
  label: any,
  textureOffsetX: number,
) => {
  const textureRects: TextureRects = calculateTextureRects(
    widthMultiplier,
    heightMultiplier,
    textureWidth,
    textureHeight,
    textureOffsetX,
  );

  const canvasSize = 512;
  canvas.width = canvasSize * widthMultiplier;
  canvas.height = canvasSize * heightMultiplier;

  const context = canvas.getContext('2d');
  if (context == null) {
    return;
  }

  // 填充画布背景颜色
  context.fillStyle = bgColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 调试模式下绘制按键帽边缘线条
  const debug = false;
  if (debug) {
    paintDebugLines(canvas, textureRects.keycapRect, textureRects.faceRect);
  }

  return paintKeycapLabel(canvas, textureRects.faceRect, legendColor, label);
};

// 定义 `Keycap` 组件，接收 `ThreeFiberKeycapProps` 类型的属性
export const Keycap: React.FC<ThreeFiberKeycapProps> = React.memo((props) => {
  const {
    label,
    scale,
    color,
    onClick,
    selected,
    disabled,
    mode,
    rotation,
    keyState,
    shouldRotate,
    keycapGeometry,
    textureOffsetX,
    textureWidth,
    textureHeight,
    onPointerOver,
    onPointerDown,
    idx,
  } = props;
  
  // 创建 `ref` 用于获取按键帽的引用
  const ref = useRef<any>();

  // 根据标签获取宏数据
  const macroData = label && getMacroData(label);
  console.log(label);
  
  // 状态：是否超出纹理范围
  const [overflowsTexture, setOverflowsTexture] = useState(false);

  // 状态：是否悬停
  const [hovered, hover] = useState(false);

  // 创建纹理和画布的引用
  const textureRef = useRef<THREE.CanvasTexture>();
  const canvasRef = useRef(document.createElement('canvas'));

  // 重新绘制画布上的按键帽
  const redraw = React.useCallback(() => {
    if (canvasRef.current && color) {
      if (shouldRotate) {
        // 绘制编码器图案
        paintEncoder(canvasRef.current, [scale[0], scale[1]], color.c, color.t);
      } else {
        // 绘制按键帽图案
        const doesOverflow = paintKeycap(
          canvasRef.current,
          [scale[0], scale[1]],
          textureWidth,
          textureHeight,
          color.c,
          color.t,
          label,
          textureOffsetX,
        );
        setOverflowsTexture(!!doesOverflow);
      }
      // 更新纹理
      textureRef.current!.needsUpdate = true;
    }
  }, [
    canvasRef.current,
    textureWidth,
    label && label.key,
    scale[0],
    scale[1],
    color && color.t,
    color && color.c,
    shouldRotate,
  ]);
  
  // 使用 `useEffect` 来监听依赖变化时重新绘制
  useEffect(redraw, [label && label.key, color && color.c, color && color.t]);

  // 控制按键的发光效果
  const glow = useSpring({
    config: {duration: 800},
    from: {x: 0, y: '#f4a0a0'},
    loop: selected ? {reverse: true} : false,
    to: {x: 100, y: '#b49999'},
  });

  // 设置按键的 Z 轴位置
  let maxZ = keycapGeometry.boundingBox!.max.z;
  const [zDown, zUp] = [maxZ, maxZ + 8];
  const pressedState =
    DisplayMode.Test === mode
      ? TestKeyState.KeyDown === keyState
        ? KeycapState.Pressed
        : KeycapState.Unpressed
      : hovered || selected
      ? KeycapState.Unpressed
      : KeycapState.Pressed;

  // 根据按键状态和旋转设置 Z 轴位置和旋转角度
  const [keycapZ, rotationZ] =
    pressedState === KeycapState.Pressed
      ? [zDown, rotation[2]]
      : [zUp, rotation[2] + Math.PI * Number(shouldRotate)];

  const wasPressed = keyState === TestKeyState.KeyUp;

  // 根据模式和按键状态设置按键颜色
  const keycapColor =
    DisplayMode.Test === mode
      ? pressedState === KeycapState.Unpressed
        ? wasPressed
          ? 'palevioletred'
          : 'lightgrey'
        : 'pink'
      : pressedState === KeycapState.Unpressed
      ? 'lightgrey'
      : 'lightgrey';

  // 使用 `useSpring` 控制按键的 Z 轴位置、颜色和旋转
  const {z, b, rotateZ, tooltipScale} = useSpring({
    config: {duration: 100},
    z: keycapZ,
    b: keycapColor,
    rotateZ: rotationZ,
    tooltipScale: !hovered ? 0 : 1,
  });

  // 根据组件状态和模式定义事件处理函数
  const [meshOnClick, meshOnPointerOver, meshOnPointerOut, meshOnPointerDown] =
    useMemo(() => {
      const noop = () => {};
      return disabled
        ? [noop, noop, noop, noop]
        : props.mode === DisplayMode.ConfigureColors
        ? [
            noop,
            (evt: ThreeEvent<MouseEvent>) => {
              if (onPointerOver) {

                onPointerOver(evt, idx);
              }
            },
            noop,
            (evt: ThreeEvent<MouseEvent>) => {
              if (onPointerDown) {
                onPointerDown(evt, idx);
              }
            },
          ]
        : [
            (evt: ThreeEvent<MouseEvent>) => onClick(evt, idx),
            (evt: ThreeEvent<MouseEvent>) => {
              if (onPointerOver) {
                
                onPointerOver(evt, idx);
              }
              hover(true);
            },
            () => hover(false),
            (evt: ThreeEvent<MouseEvent>) => {
              if (onPointerDown) {
                onPointerDown(evt, idx);
              }
            },
          ];
    }, [disabled, onClick, onPointerDown, onPointerOver, hover, idx, mode]);

  // `animated.meshPhongMaterial` 为动画材质
  const AniMeshMaterial = animated.meshPhongMaterial as any;

  return (
    <>
      {/* 渲染按键帽 */}
      <animated.mesh
        {...props}
        ref={ref}
        position-z={z}
        rotation-z={rotateZ}
        onClick={meshOnClick}
        onPointerDown={meshOnPointerDown}
        onPointerOver={meshOnPointerOver}
        onPointerOut={meshOnPointerOut}
        geometry={keycapGeometry}
      >
        <AniMeshMaterial attach="material" color={selected ? glow.y : b}>
          <canvasTexture
            ref={textureRef as any}
            attach="map"
            image={canvasRef.current}
          />
        </AniMeshMaterial>
      </animated.mesh>

      {/* 如果有宏数据或超出纹理范围，则显示 tooltip */}
      {(macroData || overflowsTexture) && (
        <React.Suspense fallback={null}>
          <animated.group
            position={props.position}
            position-z={20}
            scale={tooltipScale}
          >
            <Html
              transform
              style={{
                pointerEvents: 'none',
              }}
            >
              <KeycapTooltip>
                {macroData || (label && label.tooltipLabel)}
              </KeycapTooltip>
            </Html>
          </animated.group>
        </React.Suspense>
      )}
    </>
  );
}, shallowEqual);

