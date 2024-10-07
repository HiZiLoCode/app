import { DisplayMode } from 'src/types/keyboard-rendering';
import { getDarkenedColor } from 'src/utils/color-math';
import { CSSVarObject } from 'src/utils/keyboard-rendering';
import styled from 'styled-components';
import { Keycap2DTooltip } from '../../inputs/tooltip';
import {
  CanvasContainer,
  CanvasContainerBG,
  KeycapContainer,
  TestOverlay,
  TooltipContainer,
} from './keycap-base';

// ComboKeycap组件
export const ComboKeycap = (props: any) => {
  const {
    normalizedRects,      // 正常化后的矩形区域
    clipPath,            // 剪切路径
    overflowsTexture,    // 溢出的纹理
    macroData,           // 宏数据
    label,               // 标签
    canvasRef,           // Canvas的引用
    onClick,             // 点击事件处理函数
    onPointerDown,       // PointerDown事件处理函数
    onPointerOver,       // PointerOver事件处理函数
    onPointerOut,        // PointerOut事件处理函数
    disabled,            // 是否禁用
    ...otherProps        // 其他属性
  } = props;

  const [r1, r2] = normalizedRects; // 解构normalizedRects为r1和r2

  return (
    <>
      <KeycapContainer {...otherProps}>
        {/* ComboKeyBoundingContainer用于组合键帽的边界和交互 */}
        <ComboKeyBoundingContainer
          $selected={props.selected} // 是否选中
          onClick={onClick}
          onPointerDown={onPointerDown}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          style={{
            cursor: !disabled ? 'pointer' : 'initial', // 根据禁用状态设置光标样式
            position: 'relative',
            animation: props.disabled
              ? 'initial' // 禁用状态时，防止触发hover动画
              : props.selected
              ? '.75s infinite alternate select-glow' // 选中状态的动画
              : '',
            transform: `translateX(${
              (-Math.abs(r1[0] - r2[0]) * CSSVarObject.keyXPos) / 2
            }px) perspective(100px) translateZ(${props.keycapZ}px)`,
            width:
              Math.max(r1[2], r2[2]) * CSSVarObject.keyXPos -
              CSSVarObject.keyXSpacing,
            height:
              Math.max(r1[3], r2[3]) * CSSVarObject.keyYPos -
              CSSVarObject.keyYSpacing,
            clipPath, // 使用clipPath属性裁剪
          }}
        >
          {/* 绘制两个矩形区域 */}
          <ComboKeyRectContainer
            style={{
              position: 'absolute',
              borderRadius: 3,
              background: getDarkenedColor(props.color.c, 0.8), // 使用暗化的颜色作为背景
              transform: `translate(${CSSVarObject.keyXPos * r1[0]}px,${
                CSSVarObject.keyYPos * r1[1]
              }px)`,
              width: r1[2] * CSSVarObject.keyXPos - CSSVarObject.keyXSpacing,
              height: r1[3] * CSSVarObject.keyYPos - CSSVarObject.keyYSpacing,
            }}
          />
          <ComboKeyRectContainer
            style={{
              position: 'absolute',
              borderRadius: 3,
              transform: `translate(${CSSVarObject.keyXPos * r2[0]}px,${
                CSSVarObject.keyYPos * r2[1]
              }px)`,
              background: getDarkenedColor(props.color.c, 0.8),
              width: r2[2] * CSSVarObject.keyXPos - CSSVarObject.keyXSpacing,
              height: r2[3] * CSSVarObject.keyYPos - CSSVarObject.keyYSpacing,
            }}
          />
          <ComboKeyBGContainer
            style={{
              position: 'absolute',
              borderRadius: 3,
              background: getDarkenedColor(props.color.c, 0.8),
              transform: `translate(${CSSVarObject.keyXPos * r1[0] + 1}px,${
                1 + CSSVarObject.keyYPos * r1[1]
              }px)`,
              width:
                r1[2] * CSSVarObject.keyXPos -
                CSSVarObject.keyXSpacing - 2,
              height:
                r1[3] * CSSVarObject.keyYPos -
                CSSVarObject.keyYSpacing - 2,
            }}
          />
          {/* CanvasContainer用于绘制Canvas */}
          <CanvasContainer
            style={{
              borderRadius: 4,
              background: props.color.c,
              position: 'absolute',
              transform: `translate(${
                CSSVarObject.keyXPos * r1[0] + CSSVarObject.faceXPadding[0]
              }px,${
                CSSVarObject.faceYPadding[0] + CSSVarObject.keyYPos * r1[1]
              }px)`,
              width:
                r1[2] * CSSVarObject.keyXPos -
                CSSVarObject.keyXSpacing -
                CSSVarObject.faceXPadding[0] -
                CSSVarObject.faceXPadding[1],
              height:
                r1[3] * CSSVarObject.keyYPos -
                CSSVarObject.keyYSpacing -
                CSSVarObject.faceYPadding[0] -
                CSSVarObject.faceYPadding[1],
            }}
          />
          <CanvasContainer
            style={{
              borderRadius: 4,
              background: props.color.c,
              position: 'absolute',
              transform: `translate(${
                CSSVarObject.keyXPos * r2[0] + CSSVarObject.faceXPadding[0]
              }px,${
                CSSVarObject.faceYPadding[0] + CSSVarObject.keyYPos * r2[1]
              }px)`,
              width:
                r2[2] * CSSVarObject.keyXPos -
                CSSVarObject.keyXSpacing -
                CSSVarObject.faceXPadding[0] -
                CSSVarObject.faceXPadding[1],
              height:
                r2[3] * CSSVarObject.keyYPos -
                CSSVarObject.keyYSpacing -
                CSSVarObject.faceYPadding[0] -
                CSSVarObject.faceYPadding[1],
            }}
          />
          <CanvasContainerBG
            style={{
              borderRadius: 4,
              background: props.color.c,
              position: 'absolute',
              transform: `translate(${
                1 + CSSVarObject.keyXPos * r1[0] + CSSVarObject.faceXPadding[0]
              }px,${
                1 + CSSVarObject.faceYPadding[0] + CSSVarObject.keyYPos * r1[1]
              }px)`,
              width:
                r1[2] * CSSVarObject.keyXPos -
                CSSVarObject.keyXSpacing -
                CSSVarObject.faceXPadding[0] -
                CSSVarObject.faceXPadding[1] -
                2,
              height:
                r1[3] * CSSVarObject.keyYPos -
                CSSVarObject.keyYSpacing -
                CSSVarObject.faceYPadding[0] -
                CSSVarObject.faceYPadding[1] -
                2,
            }}
          >
            {/* Canvas元素，用于绘制图形 */}
            <canvas ref={canvasRef} style={{}} />
          </CanvasContainerBG>
          {/* 如果处于测试模式，则显示测试覆盖层 */}
          {DisplayMode.Test === props.mode ? (
            <TestOverlay
              style={{
                background: props.keycapColor,
                opacity: props.keycapOpacity,
              }}
            ></TestOverlay>
          ) : null}
        </ComboKeyBoundingContainer>
        {/* 如果有宏数据或溢出纹理，显示工具提示 */}
        {(props.macroData || props.overflowsTexture) && (
          <TooltipContainer $rotate={props.rotation[2]}>
            <Keycap2DTooltip>
              {props.macroData || (props.label && props.label.tooltipLabel)}
            </Keycap2DTooltip>
          </TooltipContainer>
        )}
      </KeycapContainer>
    </>
  );
};

// 定义ComboKeyBoundingContainer的样式
const ComboKeyBoundingContainer = styled.div<{$selected: boolean}>`
  box-sizing: border-box;
  transition: transform 0.2s ease-out; // 设置变换的过渡效果
  animation: ${(p) =>
    p.$selected ? '.75s infinite alternate select-glow' : 'initial'}; // 设置动画效果
  &:hover {
    transform: perspective(100px) translateZ(-5px); // 鼠标悬停时的变换效果
    animation: 0.5s 1 forwards select-glow; // 鼠标悬停时的动画效果
  }
`;

// 定义ComboKeyRectContainer的样式
const ComboKeyRectContainer = styled.div<{}>`
  box-sizing: border-box;
  padding: 2px 6px 10px 6px; // 内边距
  box-shadow: inset -1px -1px 0 rgb(0 0 0 / 20%),
    inset 1px 1px 0 rgb(255 255 255 / 20%); // 内阴影效果
`;

// 定义ComboKeyBGContainer的样式
const ComboKeyBGContainer = styled.div<{}>`
  box-sizing: border-box;
  padding: 3px 7px 10px 6px; // 内边距
`;
