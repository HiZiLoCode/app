import {useMemo} from 'react'; // 从 React 导入 useMemo 钩子，用于缓存计算结果，提高性能
import {useDispatch} from 'react-redux'; // 从 react-redux 导入 useDispatch，用于分发 Redux 动作
import {useAppSelector} from 'src/store/hooks'; // 自定义的 Redux 钩子，用于从全局状态中选择数据
import {
  getNumberOfLayers, // 获取层数的选择器
  getSelectedLayerIndex, // 获取选中的层索引的选择器
  setLayer, // 设置当前选中层的 Redux 动作
} from 'src/store/keymapSlice'; // 从 keymapSlice 中导入 Redux 相关的选择器和动作
import styled from 'styled-components'; // 从 styled-components 导入，用于编写组件的样式

// 定义一个容器组件，绝对定位，设置左边距为15px，字体权重为400，顶部边距为10px
const Container = styled.div`
  position: absolute;
  left: 15px;
  font-weight: 400;
  top: 10px;
`;

// 定义一个标签组件，字体大小为20px，文本转换为大写，颜色使用自定义的CSS变量
const Label = styled.label`
  font-size: 20px;
  text-transform: uppercase;
  color: var(--color_label-highlighted);
  margin-right: 6px;
`;

// 定义一个按钮组件，接收一个布尔型属性 $selected，用于判断按钮是否被选中
const LayerButton = styled.button<{$selected?: boolean}>`
  outline: none; // 去掉按钮的轮廓线
  font-variant-numeric: tabular-nums; // 使用等宽数字
  border: none; // 去掉按钮的边框
  background: ${(props) =>
    props.$selected ? 'var(--color_accent)' : 'transparent'}; // 根据 $selected 属性设置背景色
  color: ${(props) =>
    props.$selected
      ? 'var(--color_inside-accent)' // 如果选中，颜色为 accent 内部颜色
      : 'var(--color_label-highlighted)'}; // 未选中时，使用高亮颜色
  cursor: pointer; // 鼠标悬停时显示为手型
  font-size: 20px; // 字体大小为20px
  font-weight: 400; // 字体权重为400
  &:hover { // 鼠标悬停时的样式
    border: none; // 去掉边框
    background: ${(props) => (props.$selected ? 'auto' : 'var(--bg_menu)')}; // 如果未选中，背景色为菜单背景
    color: ${(props) =>
      props.$selected ? 'auto' : 'var(--color_label-highlighted)'}; // 未选中时，颜色为高亮颜色
  }
`;

// 定义 LayerControl 组件，控制层选择
export const LayerControl = () => {
  const dispatch = useDispatch(); // 获取 Redux 的 dispatch 函数，用于分发动作
  const numberOfLayers = useAppSelector(getNumberOfLayers); // 从 Redux 状态中获取层数
  const selectedLayerIndex = useAppSelector(getSelectedLayerIndex); // 获取当前选中的层索引
  
  // 使用 useMemo 缓存计算的 Layers 数组，避免在不必要的渲染中重新生成
  const Layers = useMemo(
    () =>
      new Array(numberOfLayers) // 创建一个长度为 numberOfLayers 的数组
        .fill(0) // 填充为0，避免稀疏数组
        .map((_, idx) => idx) // 将索引号作为层的标识
        .map((layerLabel) => ( // 为每一层生成一个 LayerButton 按钮
          
          <LayerButton
            key={layerLabel} // 为每个按钮设置唯一的 key
            $selected={layerLabel === selectedLayerIndex} // 判断当前按钮是否为选中的层
            onClick={() => dispatch(setLayer(layerLabel))} // 点击按钮时，分发 setLayer 动作来改变选中的层
          >
            {layerLabel} {/* 显示层的标识（索引号） */}
          </LayerButton>
        )),
    [numberOfLayers, selectedLayerIndex], // 依赖项：当层数或选中层索引变化时，重新生成 Layers
  );

  return (
    <Container> {/* 包裹所有内容的容器 */}
      <Label>Layer</Label> {/* 标签显示 "Layer" */}
      {Layers} {/* 渲染生成的 Layers 按钮组 */}
    </Container>
  );
};
