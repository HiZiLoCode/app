import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import {
  calculateKeyboardFrameDimensions, // 导入计算键盘框架尺寸的函数
  CSSVarObject, // 导入 CSS 变量对象
} from 'src/utils/keyboard-rendering'; // 从 utils 文件中导入
import styled from 'styled-components'; // 导入 styled-components 进行样式处理
import {
  KeyboardCanvasProps, // 导入键盘画布属性类型
  KeyboardCanvasContentProps, // 导入键盘内容属性类型
} from 'src/types/keyboard-rendering'; // 从类型定义中导入
import { Case } from './case'; // 导入键盘外壳组件
import { KeyGroup } from './key-group'; // 导入键组组件
import { MatrixLines } from './matrix-lines'; // 导入矩阵线组件

// 定义 KeyboardCanvas 组件，接收鼠标事件类型的属性
export const KeyboardCanvas: React.FC<KeyboardCanvasProps<React.MouseEvent>> = (
  props,
) => {
  // console.log(props);
  // 从 props 中解构出 containerDimensions 和 shouldHide 属性，其余属性通过 ...otherProps 获取
  const {matrixKeycodesList, containerDimensions, shouldHide, ...otherProps } = props;
  console.log(matrixKeycodesList);
  
  
  // 使用 useMemo 来计算键盘框架的宽度和高度，避免不必要的计算
  const { width, height } = useMemo(
    () => calculateKeyboardFrameDimensions(otherProps.keys), // 根据 keys 计算宽度和高度
    [otherProps.keys], // 依赖 keys，当其变化时重新计算
  );

  // 获取容器的高度
  const containerHeight = containerDimensions.height;
  const minPadding = 35; // 定义最小内边距

  // 计算缩放比例
  const ratio =
    Math.min(
      Math.min(
        1, // 限制最大比例为 1
        containerDimensions &&
          containerDimensions.width / 
            ((CSSVarObject.keyWidth + CSSVarObject.keyXSpacing) * width - 
              CSSVarObject.keyXSpacing + 
              minPadding * 2), // 计算可用宽度
      ),
      containerHeight / 
        ((CSSVarObject.keyHeight + CSSVarObject.keyYSpacing) * height - 
          CSSVarObject.keyYSpacing + 
          minPadding * 2), // 计算可用高度
    ) || 1; // 如果比例为 0，则默认为 1

  return (
    <div
      style={{
        transform: `scale(${ratio}, ${ratio})`, // 根据计算的比例进行缩放
        opacity: shouldHide ? 0 : 1, // 控制透明度，根据 shouldHide 设定
        position: 'absolute', // 绝对定位
        pointerEvents: shouldHide ? 'none' : 'all', // 根据 shouldHide 控制鼠标事件
      }}
    >
      <KeyboardCanvasContent {...otherProps} matrixKeycodesList={matrixKeycodesList} width={width} height={height} /> 
      {/* 渲染键盘内容组件，传递其他属性及宽高 */}
    </div>
  );
};

// 定义 KeyboardGroup 的样式
const KeyboardGroup = styled.div`
  position: relative; // 设为相对定位，以便子元素可以绝对定位
`;

// 定义 KeyboardCanvasContent 组件
const KeyboardCanvasContent: React.FC<
  KeyboardCanvasContentProps<React.MouseEvent>
> = React.memo((props) => { // 使用 React.memo 进行性能优化
  const {
    matrixKeycodesList,
    matrixKeycodes, // 矩阵键码
    keys, // 键的数据
    definition, // 键盘的定义
    pressedKeys, // 当前按下的键
    mode, // 模式
    showMatrix, // 是否显示矩阵
    selectable, // 是否可选择
    width, // 宽度
    height, // 高度
  } = props; // 解构 props
  // Case 绘制键盘外壳 
  
  return (
    <KeyboardGroup>
      
      <Case width={width} height={height}/>
      <KeyGroup
        {...props} // 将所有属性传递给 KeyGroup
        keys={keys} // 键的数据
        mode={mode} // 模式
        matrixKeycodesList={matrixKeycodesList}
        matrixKeycodes={matrixKeycodes} // 矩阵键码
        selectable={selectable} // 是否可选择
        definition={definition} // 键盘的定义
        pressedKeys={pressedKeys} // 当前按下的键
      />
      {showMatrix && ( // 如果 showMatrix 为真，渲染矩阵线
        <MatrixLines
          keys={keys} // 键的数据
          rows={definition.matrix.rows} // 矩阵的行数
          cols={definition.matrix.cols} // 矩阵的列数
          width={width} // 宽度
          height={height} // 高度
        />
      )}
    </KeyboardGroup>
  );
}, shallowEqual); // 使用 shallowEqual 进行属性比较优化，避免不必要的重新渲染
