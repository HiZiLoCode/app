import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { TestKeyState } from 'src/types/types';
import { getDarkenedColor } from 'src/utils/color-math';
import { CSSVarObject } from 'src/utils/keyboard-rendering';
import styled from 'styled-components';
import { Keycap2DTooltip,Keycap2DTooltipArray } from '../../inputs/tooltip';
import { ComboKeycap } from './combo-keycap';
import { EncoderKey } from './encoder';
import {
  CanvasContainer,
  KeycapContainer,
  TestOverlay,
  TooltipContainer,
} from './keycap-base';
import {
  KeycapState,
  TwoStringKeycapProps,
  DisplayMode,
} from 'src/types/keyboard-rendering';

const Keycap2DTooltipBorder=styled.div`
    transform: perspective(100px) translateZ(0px);
    border-radius: 4px;
    background: rgba(var(--color_accent),.8);
    box-shadow: inset -1px -1px 0 rgb(0 0 0 / 20%), inset 1px 1px 0 rgb(255 255 255 / 10%);
    height: 100%;
    white-space: pre-line;
    display: grid;
    align-content: space-around;
    /* color: var(--color_accent); */
    /*  */
    box-sizing: border-box;
    animation: initial;
    > *:nth-child(1),
    > *:nth-child(2) {
      text-align: left;
      margin-left: 3px;
    }
    >*:nth-child(2) {
      text-align: left;
    }
  `
const KeycapContainerCenter=styled.div`
    text-align: center;
   
`
const KeycapContainerBorder=styled.div<{color:any}>`
    box-shadow: inset -1px -1px 0 rgb(0 0 0 / 20%),inset 1px 1px 0 rgb(255 255 255 / 20%);
    padding: 1px 6px 10px 3px; 
    box-sizing: border-box;
     border-radius: 3px;
     transition: transform 0.2s ease-out;
    /* border: 1px solid var(--color_keycap-accent); */
    margin:  0 2px;
    min-width: 65px;
    height: 65px;
    /* background:var(--color_accent); */
    transform: perspective(100px) translateZ(0px);
    border-radius: 3px;
`
const Keycap2DTooltipSpan=styled.div`
  margin-top: 4px;
`
// 获取宏数据：如果标签长度超过15，则返回标签；否则返回宏表达式或null
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

// 在画布上绘制调试线
const paintDebugLines = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d');
  if (context == null) {
    return;
  }
  context.strokeStyle = 'magenta'; // 线条颜色为品红色
  context.lineWidth = 1; // 线条宽度为1
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(canvas.width, 0);
  context.lineTo(canvas.width, canvas.height);
  context.lineTo(0, canvas.height);
  context.lineTo(0, 0);
  context.stroke();
};

// 在画布上绘制键帽标签
const paintKeycapLabel = (
  canvas: HTMLCanvasElement,
  legendColor: string,
  label: any,
) => {
  const context = canvas.getContext('2d');
  if (context == null) {
    return;
  }
  const dpi = devicePixelRatio;
  const [canvasWidth, canvasHeight] = [canvas.width, canvas.height];
  canvas.width = canvasWidth * dpi;
  canvas.height = canvasHeight * dpi;
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  context.scale(dpi, dpi); // 进行缩放以适应高分辨率
  const fontFamily =
    'Fira Sans, Arial Rounded MT, Arial Rounded MT Bold, Arial'; // 字体系列
  // 定义不同标签的边距
  const topLabelMargin = { x: 4, y: 4 };
  const bottomLabelMargin = { x: 4, y: 4 };
  const centerLabelMargin = { x: 3, y: 0 };
  const singleLabelMargin = { x: 4, y: 4 };

  // 定义剪切路径，确保文本不会绘制到侧面
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(canvas.width, 0);
  context.lineTo(canvas.width, canvas.height);
  context.lineTo(0, canvas.height);
  context.lineTo(0, 0);
  context.clip();

  context.fillStyle = legendColor; // 设置文本颜色
  
  if (label === undefined) {
    // 如果标签未定义，不做任何操作
  } else if (label.topLabel && label.bottomLabel) {
    let fontSize = 16; // 字体大小
    let fontHeight = 0.75 * fontSize; // 字体高度
    let topLabelOffset = label.offset[0] * fontHeight;
    let bottomLabelOffset = label.offset[1] * fontHeight;
    context.font = `bold ${fontSize}px ${fontFamily}`; // 设置字体
    context.fillText(
      label.topLabel,
      topLabelMargin.x,
      topLabelMargin.y + topLabelOffset + fontHeight, // 绘制顶部标签
    );
    context.fillText(
      label.bottomLabel,
      bottomLabelMargin.x,
      canvasHeight - bottomLabelMargin.y - bottomLabelOffset, // 绘制底部标签
    );
    
  } else if (label.centerLabel) {
    let fontSize = 13 * label.size; // 根据标签大小调整字体大小
    let fontHeight = 0.75 * fontSize;
    let faceMidLeftY = canvasHeight / 2;
    context.font = `bold ${fontSize}px ${fontFamily}`; // 设置字体
    context.fillText(
      label.label,
      centerLabelMargin.x,
      faceMidLeftY + 0.5 * fontHeight, // 绘制中心标签                
    );
    // 如果标签超出画布宽度，返回true，表明需要显示工具提示
    return (
      context.measureText(label.centerLabel).width >
      canvasWidth - centerLabelMargin.x
    );
  } else if (typeof label.label === 'string') {
    let fontSize = 22; // 字体大小
    let fontHeight = 0.75 * fontSize;
    context.font = `bold ${fontSize}px ${fontFamily}`; // 设置字体
    context.fillText(
      label.label,
      singleLabelMargin.x,
      singleLabelMargin.y + fontHeight, // 绘制单一标签
    );
  }
};

// 绘制键帽背景和标签
const paintKeycap = (
  canvas: HTMLCanvasElement,
  textureWidth: number,
  textureHeight: number,
  legendColor: string,
  label: any,
) => {
  const [canvasWidth, canvasHeight] = [
    CSSVarObject.keyWidth,
    CSSVarObject.keyHeight,
  ];
  canvas.width =
    canvasWidth * textureWidth -
    CSSVarObject.faceXPadding.reduce((x, y) => x + y, 0);
  canvas.height =
    canvasHeight * textureHeight -
    CSSVarObject.faceYPadding.reduce((x, y) => x + y, 0);

  const context = canvas.getContext('2d');
  if (context == null) {
    return;
  }

  // 可以在此处设置背景色
  // context.fillStyle = bgColor;
  // context.fillRect(0, 0, canvas.width, canvas.height);

  // 调试模式：绘制调试线
  const debug = true;
  if (debug) {
    paintDebugLines(canvas);
  }

  // 绘制键帽标签
  return paintKeycapLabel(canvas, legendColor, label);
};

// Keycap组件，用于渲染键帽
export const Keycap: React.FC<TwoStringKeycapProps> = React.memo((props) => {
  // 解构 props
  const {
    label,
    scale,
    color,
    selected,
    disabled,
    mode,
    rotation,
    keyState,
    shouldRotate,
    textureWidth,
    textureHeight,
    skipFontCheck,
    idx,
  } = props;
  
  // 获取宏数据，如果有标签则调用 getMacroData 函数
  const macroData = label && getMacroData(label);
  
  // 定义 state 来跟踪纹理是否溢出
  const [overflowsTexture, setOverflowsTexture] = useState(false);

  // 定义 state 来跟踪悬停状态
  const [hovered, hover] = useState(false);
  
  // 引用 canvas 元素
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 绘制函数
  const redraw = React.useCallback(() => {
    if (
      canvasRef.current &&
      color &&
      label &&
      // 判断浏览器是否支持该字体
      (document.fonts.check('bold 16px "Fira Sans"', label.label) ||
        skipFontCheck)
    ) {
      // 仅在标签可用时渲染
      const doesOverflow = paintKeycap(
        canvasRef.current,
        textureWidth,
        textureHeight,
        color.t,
        label,
      );
      // 更新纹理是否溢出的状态
      setOverflowsTexture(!!doesOverflow);
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

  // 在标签、跳过字体检查、颜色等变化时重新绘制
  useEffect(redraw, [
    label && label.key,
    skipFontCheck,
    color && color.c,
    color && color.t,
  ]);

  // 监听字体加载完成事件
  useEffect(() => {
    document.fonts.addEventListener('loadingdone', redraw);
    return () => {
      document.fonts.removeEventListener('loadingdone', redraw);
    };
  }, []);
  debugger
  // 设置按键的 Z 轴位置（按下时向下，未按下时向上）
  const [zDown, zUp] = [-8, 0];
  const pressedState =
    DisplayMode.Test === mode
      ? TestKeyState.KeyDown === keyState
        ? KeycapState.Pressed
        : KeycapState.Unpressed
      : hovered || selected
      ? KeycapState.Pressed
      : KeycapState.Unpressed;

  const [keycapZ] =
    pressedState === KeycapState.Pressed
      ? [zDown, rotation[2]]
      : [zUp, rotation[2] + Math.PI * Number(shouldRotate)];

  // 判断按键是否被按下
  const wasPressed = keyState === TestKeyState.KeyUp;

  // 根据状态设置按键的颜色
  const keycapColor =
    DisplayMode.Test === mode
      ? pressedState === KeycapState.Unpressed
        ? wasPressed
          ? 'mediumvioletred' // 未按下状态，颜色为中等紫罗兰红色
          : 'lightgrey'
        : 'mediumvioletred' // 按下状态，颜色为中等紫罗兰红色
      : pressedState === KeycapState.Unpressed
      ? 'lightgrey'
      : 'lightgrey';

  // 设置按键的不透明度
  const keycapOpacity =
    pressedState === KeycapState.Unpressed ? (wasPressed ? 0.4 : 0) : 0.6;

  // 定义事件处理函数
  const [onClick, onPointerOver, onPointerOut, onPointerDown] = useMemo(() => {
    // 定义一个空函数，作为默认事件处理函数
    const noop = () => {};

    // 如果组件被禁用，则所有事件处理函数都设置为空函数
    if (disabled) {
      return [noop, noop, noop, noop];
    }

    // 根据当前模式决定事件处理函数
    if (props.mode === DisplayMode.ConfigureColors) {
      return [
        noop, // 点击事件处理函数为空函数
        (evt: React.MouseEvent) => {
          // 如果定义了 onPointerOver 事件处理函数，则调用它，并传递事件和索引
          if (props.onPointerOver) {
            console.log('onPointerDown');
            
            props.onPointerOver(evt, idx);
          }
        },
        noop, // 鼠标移出事件处理函数为空函数
        (evt: React.MouseEvent) => {
          // 如果定义了 onPointerDown 事件处理函数，则调用它，并传递事件和索引
          if (props.onPointerDown) {
            console.log('onPointerDown');
            props.onPointerDown(evt, idx);
          }
        },
      ];
    }

    // 默认情况下，根据不同事件类型设置处理函数
    return [
      // 点击事件处理函数：调用 onClick 事件处理函数，并传递事件和索引
      (evt: React.MouseEvent) => props.onClick(evt, idx),

      // 鼠标悬停事件处理函数：调用 onPointerOver 事件处理函数（如果定义），并设置 hover 状态为 true
      (evt: React.MouseEvent) => {
        if (props.onPointerOver) {
          console.log('onPointerOver');
          
          props.onPointerOver(evt, idx);
        }
        // console.log(idx,idx);
        hover(true);
      },

      // 鼠标移出事件处理函数：将 hover 状态设置为 false
      () => hover(false),

      // 鼠标按下事件处理函数：调用 onPointerDown 事件处理函数（如果定义），并传递事件和索引
      (evt: React.MouseEvent) => {
        if (props.onPointerDown) {
          console.log('onPointerDown');
          
          props.onPointerDown(evt, idx);
        }
      },
    ];
  }, [
    disabled, // 依赖 disabled 状态
    props.onClick, // 依赖 onClick 事件处理函数
    props.onPointerDown, // 依赖 onPointerDown 事件处理函数
    props.onPointerOver, // 依赖 onPointerOver 事件处理函数
    hover, // 依赖 hover 状态
    idx, // 依赖索引
    mode, // 依赖模式
  ]);

  // 根据状态选择渲染 EncoderKey、ComboKeycap 或 KeycapContainer
  // console.log('shouldRotate',shouldRotate,props.clipPath );
  
  return shouldRotate ? (
    <EncoderKey
      onClick={onClick}
      size={textureWidth * CSSVarObject.keyWidth}
      style={{
        transform: `translate(${
          props.position[0] -
          (CSSVarObject.keyWidth * textureWidth - CSSVarObject.keyWidth) / 2
        }px,${
          (textureWidth * (CSSVarObject.keyHeight - CSSVarObject.keyWidth)) / 2 +
          props.position[1] -
          (CSSVarObject.keyHeight * textureHeight - CSSVarObject.keyHeight) / 2
        }px) rotate(${-props.rotation[2]}rad)`,
        borderRadius: 3,
        color: props.color.c,
      }}
    />
  ) : props.clipPath ? (
    <ComboKeycap
      {...props}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      keycapZ={keycapZ}
      keycapOpacity={keycapOpacity}
      keycapColor={keycapColor}
      canvasRef={canvasRef}
      macroData={macroData}
      overflowsTexture={overflowsTexture}
      style={{
        transform: `translate(${
          CSSVarObject.keyWidth / 2 +
          props.position[0] -
          (CSSVarObject.keyXPos * textureWidth - CSSVarObject.keyXSpacing) / 2
        }px,${
          CSSVarObject.keyHeight / 2 +
          props.position[1] -
          (CSSVarObject.keyYPos * textureHeight - CSSVarObject.keyYSpacing) / 2
        }px) rotate(${-props.rotation[2]}rad)`,
        width: textureWidth * CSSVarObject.keyXPos - CSSVarObject.keyXSpacing,
        height: textureHeight * CSSVarObject.keyYPos - CSSVarObject.keyYSpacing,
      }}
    />
  ) :  (
    <>
      <KeycapContainer
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        style={{
          transform: `translate(${
            CSSVarObject.keyWidth / 2 +
            props.position[0] -
            (CSSVarObject.keyXPos * textureWidth - CSSVarObject.keyXSpacing) / 2
          }px,${
            CSSVarObject.keyHeight / 2 +
            props.position[1] -
            (CSSVarObject.keyYPos * textureHeight - CSSVarObject.keyYSpacing) / 2
          }px) rotate(${-props.rotation[2]}rad)`,
          width: textureWidth * CSSVarObject.keyXPos - CSSVarObject.keyXSpacing,
          height:
            textureHeight * CSSVarObject.keyYPos - CSSVarObject.keyYSpacing,
          cursor: !disabled ? 'pointer' : 'initial',
        }}
      >
        <GlowContainer
          $selected={selected}
          style={{
            animation: disabled
              ? 'initial' // 禁用状态时防止触发悬停动画
              : selected
              ? '.75s infinite alternate select-glow' // 选中状态时触发动画
              : '',
            background: getDarkenedColor(props.color.c, 0.8),
            transform: `perspective(100px) translateZ(${keycapZ}px)`,
            borderRadius: 3,
            width:
              textureWidth * CSSVarObject.keyXPos - CSSVarObject.keyXSpacing,
            height:
              textureHeight * CSSVarObject.keyYPos - CSSVarObject.keyYSpacing,
          }}
        >
          {DisplayMode.Test === mode ? (
            <TestOverlay
              style={{
                background: keycapColor,
                opacity: keycapOpacity,
              }}
            ></TestOverlay>
          ) : null}
          <CanvasContainer
            style={{
              borderRadius: 4,
              background: props.color.c,
              height: '100%',
           
            }}
          >
            <canvas ref={canvasRef} style={{}} />
          </CanvasContainer>
        </GlowContainer>
        {/* {(macroData || overflowsTexture) ? (
          <TooltipContainer $rotate={rotation[2]}>
            <Keycap2DTooltip>
              {macroData || (label && label.tooltipLabel)}
            </Keycap2DTooltip>
          </TooltipContainer>
        )
        :
        (
       
        )
        } */}
         <TooltipContainer  $rotate={rotation[2]}>
            <Keycap2DTooltipArray>
             {
                label && label.tooltipLabels.map((tooltipLabe:string,index:number) =>                   
                <KeycapContainerCenter key={index}>
                  <KeycapContainerBorder color={props.color.c} style={{  
                            animation: disabled
                      ? 'initial' // 禁用状态时防止触发悬停动画
                      : selected
                      ? '.75s infinite alternate select-glow' // 选中状态时触发动画
                      : '',
                    background: getDarkenedColor(props.color.c, 0.8),
                    transform: `perspective(100px) translateZ(${keycapZ}px)`,
                    borderRadius: 3,
                    width:
                      textureWidth * CSSVarObject.keyXPos - CSSVarObject.keyXSpacing,
                    height:
                      textureHeight * CSSVarObject.keyYPos - CSSVarObject.keyYSpacing  + 10,
                      }}>
                    <Keycap2DTooltipBorder
                      style={{
                        borderRadius: 4,
                        background: props.color.c,
                        height: '100%',
                        color:props.color.t,
                      }}
                    > {tooltipLabe.split('\n').map(item=><div>{item}</div>)}</Keycap2DTooltipBorder> 
                  </KeycapContainerBorder>
                  <Keycap2DTooltipSpan><span style={{padding:"2px 10px",backgroundColor:"var(--color_keycap-accent)",borderRadius:"20px"}}>Fn {index+1}</span></Keycap2DTooltipSpan>   
                </KeycapContainerCenter>)
             }
            </Keycap2DTooltipArray>
        </TooltipContainer>
      </KeycapContainer>
    </>
  );
}, shallowEqual);


// GlowContainer组件：用于绘制选中状态的发光效果
const GlowContainer = styled.div<{$selected: boolean}>`
  box-sizing: border-box;
  padding: 2px 6px 10px 6px; // 内边距
  transition: transform 0.2s ease-out; // 转换动画
  box-shadow: inset -1px -1px 0 rgb(0 0 0 / 20%),
    inset 1px 1px 0 rgb(255 255 255 / 20%); // 内阴影
  animation: ${(p) =>
    p.$selected ? '.75s infinite alternate select-glow' : 'initial'}; // 根据选中状态决定动画
  &:hover {
    transform: perspective(100px) translateZ(-5px); // 悬停时提升效果
    animation: 0.5s 1 forwards select-glow; // 悬停时动画
  }
`;
