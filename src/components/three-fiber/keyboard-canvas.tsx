import { PresentationControls } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React, { useEffect, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import {
  calculateKeyboardFrameDimensions,
  CSSVarObject,
} from 'src/utils/keyboard-rendering';
import {
  KeyboardCanvasContentProps,
  KeyboardCanvasProps,
} from 'src/types/keyboard-rendering';
import { Case } from './case';
import { KeyGroup } from './key-group';
import { DisplayMode } from 'src/types/keyboard-rendering';
import { MatrixLines } from './matrix-lines';
import { a, SpringValue, useSpring } from '@react-spring/three';

// KeyboardCanvas 组件
export const KeyboardCanvas: React.FC<
  KeyboardCanvasProps<ThreeEvent<MouseEvent>>
> = (props) => {
  const { containerDimensions, shouldHide, ...otherProps } = props;
  
  // 计算键盘框架的宽度和高度
  const { width, height } = useMemo(
    () => calculateKeyboardFrameDimensions(otherProps.keys),
    [otherProps.keys],
  );

  const [sceneMouseOver, setSceneMouseover] = useState(false);

  // 定义动画效果的垂直位置和倾斜角度
  const { verticalPostion, tilt } = useSpring({
    config: { tension: 35, friction: 5, mass: 0.3 },
    verticalPostion: sceneMouseOver ? 1 : -3,
    tilt: sceneMouseOver ? -0.15 : 0,
  });

  // 添加事件监听器来跟踪鼠标悬停状态
  useEffect(() => {
    const canvasElement = document.querySelector('canvas');
    if (canvasElement) {
      canvasElement.addEventListener('mouseenter', () => {
        setSceneMouseover(true);
      });
      canvasElement.addEventListener('mouseleave', () => {
        setSceneMouseover(false);
      });
    }
  }, []);

  // 计算画布的缩放比例
  const ratio =
    Math.min(
      Math.min(
        1,
        containerDimensions &&
          containerDimensions.width /
            ((CSSVarObject.keyWidth + CSSVarObject.keyXSpacing) * width -
              CSSVarObject.keyXSpacing +
              70),
      ),
      500 /
        ((CSSVarObject.keyHeight + CSSVarObject.keyYSpacing) * height -
          CSSVarObject.keyYSpacing +
          70),
    ) || 1;

  return (
    <group
      position={[0, -0.0, -19]} // 设置位置
      scale={0.015 * ratio} // 设置缩放比例
      visible={!shouldHide} // 设置是否可见
    >
      <KeyboardCanvasContent
        {...otherProps}
        width={width}
        height={height}
        verticalPostion={verticalPostion}
        tilt={tilt}
      />
    </group>
  );
};

// KeyboardCanvasContent 组件
const KeyboardCanvasContent: React.FC<
  KeyboardCanvasContentProps<ThreeEvent<MouseEvent>> & {
    verticalPostion: SpringValue<number>;
    tilt: SpringValue<number>;
  }
> = React.memo((props) => {
  const {
    matrixKeycodes,
    keys,
    definition,
    pressedKeys,
    mode,
    showMatrix,
    selectable,
    width,
    height,
    verticalPostion,
    tilt,
  } = props;
  console.log( matrixKeycodes,
    keys,
    definition,
    pressedKeys,
    mode,
    showMatrix,
    selectable,
    width,
    height,
    verticalPostion,
    tilt,);
  
  return (
    <a.group position-y={verticalPostion} rotation-x={tilt}>
      <PresentationControls
        enabled={props.mode !== DisplayMode.ConfigureColors} // 控制是否启用控制功能
        global={true} // 全局旋转或通过拖动模型旋转
        snap={true} // 确保模型旋转时回到中心
        speed={1} // 旋转速度因子
        zoom={1} // 达到极限时的缩放因子
        polar={[-Math.PI / 10, Math.PI / 10]} // 垂直旋转限制
        azimuth={[-Math.PI / 16, Math.PI / 16]} // 水平旋转限制
        config={{ mass: 1, tension: 170, friction: 26 }} // 弹簧配置
      >
        {/* // 渲染键盘外壳 */}
        <Case width={width} height={height} /> 
        <KeyGroup
          {...props}
          keys={keys}
          mode={mode}
          matrixKeycodes={matrixKeycodes}
          selectable={selectable}
          definition={definition}
          pressedKeys={pressedKeys}
        /> 
        {/* // 渲染键盘按键组 */}
        {showMatrix && (
          <MatrixLines
            keys={keys}
            rows={definition.matrix.rows}
            cols={definition.matrix.cols}
            width={width}
            height={height}
          />
        )} 
        {/* // 渲染矩阵线条 */}
      </PresentationControls>
    </a.group>
  );
}, shallowEqual);
