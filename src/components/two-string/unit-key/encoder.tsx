import styled from 'styled-components';

// EncoderKeyContainer用于包裹EncoderKey的主要容器
const EncoderKeyContainer = styled.div`
  position: absolute; // 绝对定位
  left: 0; // 距离左边缘0px
  top: 0; // 距离上边缘0px
  width: 52px; // 宽度设为52px
  opacity: 1; // 不透明度设为1
  height: 52px; // 高度设为52px
  &:hover {
    z-index: 1; // 鼠标悬停时，z-index设为1，确保该元素位于其他元素之上
    animation: 0.75s infinite alternate select-glow; // 鼠标悬停时应用动画效果
  }
`;

// EncoderKeyContent2用于显示EncoderKey的内容部分
const EncoderKeyContent2 = styled.div<{$innerPadding: number; $size: number}>`
  // 使用CSS变量来定义尺寸和内边距
  --inner-padding: ${(p) => p.$innerPadding}px; // 内边距
  --size: ${(p) => p.$size}px; // 尺寸
  --inner-size: ${(p) => p.$size - p.$innerPadding * 2}px; // 内部尺寸
  --half-size: ${(p) => (p.$size - p.$innerPadding * 2) / 2}px; // 内部尺寸的一半
  --half-size-p1: ${(p) => 1 + (p.$size - p.$innerPadding * 2) / 2}px; // 内部尺寸的一半，加1px
  --half-size-p05p: ${(p) =>
    p.$innerPadding / 2 + (p.$size - p.$innerPadding * 2) / 2}px; // 内部尺寸的一半，加上内边距的一半
  background-color: currentColor; // 背景颜色与当前文字颜色相同
  padding: var(--inner-padding); // 使用内边距变量
  min-width: var(--size); // 最小宽度
  min-height: var(--size); // 最小高度
  clip-path: polygon(
    50% 0%,
    46.93% 3.1%,
    43.47% 0.43%,
    40.83% 3.9%,
    37.06% 1.7%,
    34.89% 5.49%,
    30.87% 3.81%,
    29.21% 7.85%,
    25% 6.7%,
    23.89% 10.92%,
    19.56% 10.33%,
    19.01% 14.66%,
    14.64% 14.64%,
    14.66% 19.01%,
    10.33% 19.56%,
    10.92% 23.89%,
    6.7% 25%,
    7.85% 29.21%,
    3.81% 30.87%,
    5.49% 34.89%,
    1.7% 37.06%,
    3.9% 40.83%,
    0.43% 43.47%,
    3.1% 46.93%,
    0% 50%,
    3.1% 53.07%,
    0.43% 56.53%,
    3.9% 59.17%,
    1.7% 62.94%,
    5.49% 65.11%,
    3.81% 69.13%,
    7.85% 70.79%,
    6.7% 75%,
    10.92% 76.11%,
    10.33% 80.44%,
    14.66% 80.99%,
    14.64% 85.36%,
    19.01% 85.34%,
    19.56% 89.67%,
    23.89% 89.08%,
    25% 93.3%,
    29.21% 92.15%,
    30.87% 96.19%,
    34.89% 94.51%,
    37.06% 98.3%,
    40.83% 96.1%,
    43.47% 99.57%,
    46.93% 96.9%,
    50% 100%,
    53.07% 96.9%,
    56.53% 99.57%,
    59.17% 96.1%,
    62.94% 98.3%,
    65.11% 94.51%,
    69.13% 96.19%,
    70.79% 92.15%,
    75% 93.3%,
    76.11% 89.08%,
    80.44% 89.67%,
    80.99% 85.34%,
    85.36% 85.36%,
    85.34% 80.99%,
    89.67% 80.44%,
    89.08% 76.11%,
    93.3% 75%,
    92.15% 70.79%,
    96.19% 69.13%,
    94.51% 65.11%,
    98.3% 62.94%,
    96.1% 59.17%,
    99.57% 56.53%,
    96.9% 53.07%,
    100% 50%,
    96.9% 46.93%,
    99.57% 43.47%,
    96.1% 40.83%,
    98.3% 37.06%,
    94.51% 34.89%,
    96.19% 30.87%,
    92.15% 29.21%,
    93.3% 25%,
    89.08% 23.89%,
    89.67% 19.56%,
    85.34% 19.01%,
    85.36% 14.64%,
    80.99% 14.66%,
    80.44% 10.33%,
    76.11% 10.92%,
    75% 6.7%,
    70.79% 7.85%,
    69.13% 3.81%,
    65.11% 5.49%,
    62.94% 1.7%,
    59.17% 3.9%,
    56.53% 0.43%,
    53.07% 3.1%
  ); // 使用clip-path定义多边形剪切路径

  // 定义多个径向渐变背景
  background-image: radial-gradient(
      currentColor var(--half-size),
      transparent var(--half-size-p1)
    ), // 当前文字颜色的径向渐变
    radial-gradient(
      rgba(255, 255, 255, 0.6) var(--half-size), 
      transparent var(--half-size-p1)
    ),// 白色渐变
    radial-gradient(
      rgba(0, 0, 0, 0.2) var(--half-size), 
      transparent var(--half-size-p05p)
    ),// 黑色渐变
    radial-gradient(
      rgba(0, 0, 0, 0.2) var(--half-size), 
      transparent var(--half-size-p05p)
    );// 再次使用黑色渐变
  background-size: var(--size) var(--size); // 背景图像的大小
  background-position: 0px 0px, -0.5px -0.5px, 0px 0px,
    calc(var(--inner-padding) / 2) calc(var(--inner-padding) / 2); // 背景图像的位置
  background-repeat: repeat; // 背景图像的重复方式

  transition: transform 0.5s ease-out; // 变换的过渡效果
  transform: rotate(0); // 初始旋转角度为0
  box-sizing: border-box; // 盒子模型使用border-box
  &:hover {
    transform: rotate(450deg); // 鼠标悬停时旋转450度
  }
`;

// EncoderKey组件，用于显示编码器键
export const EncoderKey = (props: {
  size: number; // 键的尺寸
  style: React.CSSProperties; // 外部样式
  onClick: (evt: React.MouseEvent) => void; // 点击事件处理函数
}) => {
  return (
    <EncoderKeyContainer onClick={props.onClick} style={props.style}>
      <EncoderKeyContent2
        $size={props.size && +props.size} // 将尺寸传递给EncoderKeyContent2
        $innerPadding={(5 * props.size) / 52} // 根据尺寸计算内边距
      />
    </EncoderKeyContainer>
  );
};
