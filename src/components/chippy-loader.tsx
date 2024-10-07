import styled from 'styled-components';
import imgSrc from 'assets/images/chippy_600.png';
import { Theme } from 'src/utils/themes';
import { getDarkenedColor } from 'src/utils/color-math';
import { getSelectedTheme } from 'src/store/settingsSlice';
import { useAppSelector } from 'src/store/hooks';

// 默认的Chippy图像设置
const defaultChippy = {
  width: 300,
  height: 300,
  src: imgSrc,
};

// Loader容器样式
const LoaderContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

// 圆形进度条容器样式
const CircleContainer = styled.div<{
  $containerHeight: number;
  $containerWidth: number;
  $progress: number | null;
  $progressColor: string;
}>`
  border-radius: 50%; // 圆形边框
  background-color: var(--bg_icon); // 背景颜色
  height: ${(props) => props.$containerHeight}px; // 容器高度
  width: ${(props) => props.$containerWidth}px; // 容器宽度
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;

  animation-duration: 1.5s; // 动画持续时间
  animation-name: roll; // 动画名称
  animation-iteration-count: infinite; // 动画循环次数
  animation-direction: alternate; // 动画方向
  animation-timing-function: ease-in-out; // 动画时序函数

  &::after {
    height: ${(props) => props.$containerHeight}px; // 伪元素高度
    width: ${(props) => props.$containerWidth}px; // 伪元素宽度
    position: absolute;
    content: '';
    background-color: ${(p) => p.$progressColor}; // 伪元素背景颜色
    top: ${(props) => props.$containerHeight + 1}px; // 顶部位置
    left: 0;
    right: 0;
    transition: transform 0.4s ease-out; // 变换过渡效果
    transform: translate3d(
      0,
      ${(props) => -(props.$progress || 0) * props.$containerHeight}px, 
      0
    );// 根据进度设置偏移
  }
`;

// 组件属性类型定义
type Props = {
  progress: number | null; // 进度值
  width?: number; // 宽度
  height?: number; // 高度
  theme: Theme; // 主题
};

// SVG组件
const SvgComponent: React.FC<any & { theme: Theme }> = (props) => {
  const { theme } = props;

  // 计算暗色调
  const darkAccent = getDarkenedColor(theme.accent.c, 0.8);
  // 颜色映射表
  const colorMap = {
    'upper-body': theme.mod.t,
    'lower-body': theme.mod.c,
    accent: darkAccent,
    bowtie: darkAccent,
    pins: darkAccent,
    feet: '#000',
  };

  return (
    <svg
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      x={0}
      y={0}
      viewBox="0 0 600 600"
      style={{
        enableBackground: 'new 0 0 600 600',
      }}
      xmlSpace="preserve"
      {...props}
    >
      <style>
        {`.st3{fill:#fdfefe}.st4{fill:${colorMap.bowtie}}.st5{fill-rule:evenodd;clip-rule:evenodd;fill:${colorMap.accent}}.st7,.st9{fill-rule:evenodd;clip-rule:evenodd}.st10,.st9{fill:#fff}`}
      </style>
      <g id="Layer_2_00000088814685506851870240000015950599998114990989_">
        <g id="Feet" transform="translate(00.000000,605.000000) scale(0.830000,-0.830000)">
          <path style={{
            fill: colorMap['upper-body'],
          }} xmlns="http://www.w3.org/2000/svg" d="M207 671 c-101 -52 -166 -134 -193 -244 -29 -117 5 -235 93 -323 38 -37 127 -94 148 -94 3 0 5 26 5 58 0 56 -2 60 -40 91 -93 74 -121 217 -64 322 16 29 46 65 66 82 35 28 38 35 38 79 0 26 -4 48 -8 48 -4 0 -25 -9 -45 -19z"></path>
        </g>
        <g id='Body' transform="translate(130.000000,591.000000) scale(0.800000,-0.800000)" stroke="none">
          <path xmlns="http://www.w3.org/2000/svg" d="M168 703 l-28-4 0-351 0-350 88 4c63 3 100 11 135 27 26 13 47 27 47 31 0 4-8 18-18 30-17 21-21 21-80 10-34-6-67-8-72-5-6 4-10 77-10 181 0 148-2 174-15 174-10 0-15 11-15 35-4 16 7 22 22 22 11 0 15 12 15 51l0 52 48-5c93-9 167-64 210-157 21-45 24-64 19-117-2-36-14-81-26-104-11-22-17-40-13-40 4 0 15-12 24-27l16-27 27 53c49 98 45 225-12 327-66 118-225 197-351 191z"/>
          <path style={{
            fill: colorMap['upper-body'],
          }} xmlns="http://www.w3.org/2000/svg" d="M205 515 c-7 -2 -13 -18 -13 -34 0 -29 1 -29 55 -29 60 0 95 -22 95 -59 0 -30 -48 -81 -76 -81 -13 0 -24 -2 -24 -5 0 -3 48 -66 106 -140 l106 -135 50 0 c59 0 62 -9 -54 132 -48 59 -88 109 -88 112 0 2 16 20 35 39 30 30 35 42 35 80 0 80 -61 128 -162 126 -29 0 -59 -3 -65 -6z" />
        </g>
      </g>
    </svg>
  );
};

// ChippyLoader组件
export default function ChippyLoader(props: Props) {
  const width = props.width || defaultChippy.width; // 获取宽度，默认值为300
  const height = props.height || defaultChippy.height; // 获取高度，默认值为300
  const containerPadding = width * 0.25; // 计算容器内边距
  const [containerHeight, containerWidth] = [
    height + containerPadding * 2, // 容器总高度
    width + containerPadding * 2, // 容器总宽度
  ];
  const selectedTheme = useAppSelector(getSelectedTheme); // 获取当前选择的主题

  return (
    <LoaderContainer>
      <CircleContainer
        $progress={props.progress} // 进度值
        $progressColor={getDarkenedColor(selectedTheme.accent.c, 0.9)} // 进度条颜色
        $containerHeight={containerHeight} // 容器高度
        $containerWidth={containerWidth} // 容器宽度
      >
        <div
          style={{
            zIndex: 1,
            width: width, // SVG图像的宽度
          }}
        >
          <SvgComponent theme={props.theme} /> {/* 渲染SVG组件 */}
        </div>
      </CircleContainer>
    </LoaderContainer>
  );
}
