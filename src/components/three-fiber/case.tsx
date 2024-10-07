// 导入所需的类型和库
import {KeyColorType} from '@the-via/reader'; // 导入键色类型
import React from 'react'; // 导入React库
import {useMemo} from 'react'; // 导入useMemo钩子
import {shallowEqual} from 'react-redux'; // 导入浅比较函数
import {getSelectedDefinition} from 'src/store/definitionsSlice'; // 导入获取选中定义的函数
import {useAppSelector} from 'src/store/hooks'; // 导入Redux选择器钩子
import {getSelectedTheme} from 'src/store/settingsSlice'; // 导入获取选中主题的函数
import {getDarkenedColor} from 'src/utils/color-math'; // 导入颜色计算工具
import {KeycapMetric} from 'src/utils/keyboard-rendering'; // 导入键帽度量工具
import {Shape, Path} from 'three'; // 导入Three.js的Shape和Path类

// 创建板子形状的函数
function makePlateShape(
  {width, height}: {width: number; height: number}, // 参数为宽度和高度
  keys: {position: number[]; rotation: number[]; scale: number[]}[], // 按键的位置、旋转和缩放
) {
  const shape = new Shape(); // 创建一个Shape对象来表示板子的形状

  let sizeX = width; // 板子的宽度
  let sizeY = height; // 板子的高度
  let radius = 0.1; // 圆角半径

  // 计算四个角的圆角弧形
  let halfX = sizeX * 0.5 - radius; // 半宽减去圆角
  let halfY = sizeY * 0.5 - radius; // 半高减去圆角
  let baseAngle = Math.PI * 0.5; // 基础角度（90度）

  // 右上角圆弧
  shape.absarc(
    halfX,
    halfY,
    radius,
    baseAngle * 0,
    baseAngle * 0 + baseAngle,
    false,
  );
  // 左上角圆弧
  shape.absarc(
    -halfX,
    halfY,
    radius,
    baseAngle * 1,
    baseAngle * 1 + baseAngle,
    false,
  );
  // 左下角圆弧
  shape.absarc(
    -halfX,
    -halfY,
    radius,
    baseAngle * 2,
    baseAngle * 2 + baseAngle,
    false,
  );
  // 右下角圆弧
  shape.absarc(
    halfX,
    -halfY,
    radius,
    baseAngle * 3,
    baseAngle * 3 + baseAngle,
    false,
  );

  // 计算所有按键的位置以确定板子的大小
  const {x: minX, y: maxY} = keys.reduce(
    ({x, y}, {position}) => {
      return {x: Math.min(position[0], x), y: Math.max(position[1], y)}; // 找到最小x和最大y
    },
    {x: Infinity, y: -Infinity},
  );
  const {x: maxX, y: minY} = keys.reduce(
    ({x, y}, {position}) => {
      return {x: Math.max(position[0], x), y: Math.min(position[1], y)}; // 找到最大x和最小y
    },
    {x: 6, y: -6},
  );
  
  const positionWidth = maxX - minX; // 计算按键的x跨度
  const positionHeight = maxY - minY; // 计算按键的y跨度

  // 为每个按键生成孔洞
  const holes = keys.map(({position, scale, rotation}) => {
    const path = new Path(); // 创建一个路径对象来表示孔洞
    const angle = rotation[2]; // 获取按键的旋转角度
    const [keyWidth, keyHeight] = [0.9 * scale[0], 0.9 * scale[1]]; // 计算按键的宽度和高度
    const [x, y] = [
      (position[0] * halfX * 2 * 0.95) / positionWidth - 0.1, // 按键的x位置
      (position[1] * halfY * 2 * 0.85) / positionHeight + 0.2, // 按键的y位置
    ];

    // 计算按键四个顶点的坐标
    const ctrx =
      x + (keyWidth / 2) * Math.cos(angle) - (keyHeight / 2) * Math.sin(angle);
    const ctry =
      y + (keyWidth / 2) * Math.sin(angle) + (keyHeight / 2) * Math.cos(angle);
    const ctlx =
      x - (keyWidth / 2) * Math.cos(angle) - (keyHeight / 2) * Math.sin(angle);
    const ctly =
      y - (keyWidth / 2) * Math.sin(angle) + (keyHeight / 2) * Math.cos(angle);
    const cblx =
      x - (keyWidth / 2) * Math.cos(angle) + (keyHeight / 2) * Math.sin(angle);
    const cbly =
      y - (keyWidth / 2) * Math.sin(angle) - (keyHeight / 2) * Math.cos(angle);
    const cbrx =
      x + (keyWidth / 2) * Math.cos(angle) + (keyHeight / 2) * Math.sin(angle);
    const cbry =
      y + (keyWidth / 2) * Math.sin(angle) - (keyHeight / 2) * Math.cos(angle);

    // 生成孔洞路径
    path.moveTo(-halfX + ctlx, halfY + ctly); // 移动到左上角
    path.lineTo(-halfX + ctrx, halfY + ctry); // 右上角
    path.lineTo(-halfX + cbrx, halfY + cbry); // 右下角
    path.lineTo(-halfX + cblx, halfY + cbly); // 左下角

    return path; // 返回孔洞路径
  });

  shape.holes = holes; // 将孔洞添加到形状中
  return shape; // 返回最终的形状
}

// 创建简化形状的函数
function makeShape({width, height}: {width: number; height: number}) {
  const shape = new Shape(); // 创建Shape对象

  let sizeX = width; // 板子宽度
  let sizeY = height; // 板子高度
  let radius = 0.1; // 圆角半径

  let halfX = sizeX * 0.5 - radius; // 半宽减去圆角
  let halfY = sizeY * 0.5 - radius; // 半高减去圆角
  let baseAngle = Math.PI * 0.5; // 基础角度
  let inclineAngle = (Math.PI * 7.5) / 180; // 倾斜角度

  // 创建右上角圆弧，考虑倾斜角度
  shape.absarc(
    halfX + Math.atan(inclineAngle) * sizeY,
    halfY,
    radius,
    baseAngle * 0,
    baseAngle * 0 + baseAngle,
    false,
  );
  // 创建左上角圆弧
  shape.absarc(
    -halfX,
    halfY,
    radius,
    baseAngle * 1,
    baseAngle * 1 + baseAngle,
    false,
  );
  // 创建左下角圆弧
  shape.absarc(
    -halfX,
    -halfY,
    radius,
    baseAngle * 2,
    baseAngle * 2 + baseAngle,
    false,
  );
  // 创建右下角圆弧
  shape.absarc(
    halfX,
    -halfY,
    radius,
    baseAngle * 3,
    baseAngle * 3 + baseAngle,
    false,
  );
  return shape; // 返回生成的形状
}

// SimplePlate组件，用于渲染一个简单的板子
const SimplePlate: React.FC<{width: number; height: number}> = ({
  width,
  height,
}) => {
  const depthOffset = 0.5; // 深度偏移量
  const heightOffset = 0.5; // 高度偏移量
  const definition = useAppSelector(getSelectedDefinition); // 从store中获取当前选中的定义
  if (!definition) {
    return null; // 如果没有定义，返回null
  }
  // 生成板子形状
  const plateShape = makePlateShape(
    {width: width + depthOffset / 4, height: height + heightOffset / 4},
    [], // 空的按键数组
  );
  const innerColor = '#212020'; // 内部颜色

  return (
    <group
      position={[0.6, -heightOffset / 8, width / 2 + depthOffset / 2]} // 设置组的位置信息
      rotation-z={(-7.5 * Math.PI) / 180} // 设置z轴旋转
    >
      <mesh rotation-y={Math.PI / 2} castShadow={true}> {/* 创建网格，投射阴影 */}
        <extrudeGeometry
          attach="geometry"
          args={[ // 创建几何体，使用板子形状和设置
            plateShape,
            {
              bevelEnabled: true, // 启用斜面
              bevelSize: 0.1, // 斜面大小
              bevelThickness: 0.1, // 斜面厚度
              bevelSegments: 10, // 斜面分段
              depth: 0.25, // 深度
            },
          ]}
        />
        <meshPhongMaterial // 创建材料
          color={innerColor} // 设置颜色
          shininess={100} // 光泽度
          reflectivity={1} // 反射率
          specular={'#161212'} // 镜面反射色
        />
      </mesh>
    </group>
  );
};

// 心形组件，用于渲染心形
const Heart = React.memo(
  (props: {caseWidth: number; caseHeight: number; color: string}) => {
    const heartAngle = Math.atan(2 / props.caseWidth); // 计算心形角度

    const midXOffset = (80 + -30) / 2; // 中间X偏移量
    const radius = 2; // 半径
    const bezelSize = 1; // 边框大小
    const caseYHeight = -(-props.caseWidth - bezelSize * 2 - radius * 2); // 计算Y高度
    const backHeight = caseYHeight / Math.cos(heartAngle); // 计算背部高度
    const scale = (0.1 * backHeight) / 22; // 计算缩放比例
    const midYOffset = 95; // 中间Y偏移量
    const heartHeight = 95 * scale; // 心形高度
    const midMidOffset = (backHeight - heartHeight) / 2; // 中间中间偏移量
    const heartShape = useMemo(() => {
      const shape = new Shape(); // 创建Shape对象
      // 定义心形的路径
      shape.moveTo(scale * (25 - midXOffset), scale * (25 - midYOffset));
      shape.bezierCurveTo(
        scale * (25 - midXOffset),
        scale * (25 - midYOffset),
        scale * (20 - midXOffset),
        scale * (0 - midYOffset),
        scale * (0 - midXOffset),
        scale * (0 - midYOffset),
      );
      shape.bezierCurveTo(
        scale * (-30 - midXOffset),
        scale * (0 - midYOffset),
        scale * (-30 - midXOffset),
        scale * (35 - midYOffset),
        scale * (-30 - midXOffset),
        scale * (35 - midYOffset),
      );
      shape.bezierCurveTo(
        scale * (-30 - midXOffset),
        scale * (55 - midYOffset),
        scale * (-10 - midXOffset),
        scale * (77 - midYOffset),
        scale * (25 - midXOffset),
        scale * (95 - midYOffset),
      );
      shape.bezierCurveTo(
        scale * (60 - midXOffset),
        scale * (77 - midYOffset),
        scale * (80 - midXOffset),
        scale * (55 - midYOffset),
        scale * (80 - midXOffset),
        scale * (35 - midYOffset),
      );
      shape.bezierCurveTo(
        scale * (80 - midXOffset),
        scale * (35 - midYOffset),
        scale * (80 - midXOffset),
        scale * (0 - midYOffset),
        scale * (50 - midXOffset),
        scale * (0 - midYOffset),
      );
      shape.bezierCurveTo(
        scale * (35 - midXOffset),
        scale * (0 - midYOffset),
        scale * (25 - midXOffset),
        scale * (25 - midYOffset),
        scale * (25 - midXOffset),
        scale * (25 - midYOffset),
      );
      return shape; // 返回生成的心形路径
    }, [props.caseWidth, props.caseHeight, props.color]);

    const extrudeSettings = {
      depth: 4, // 挤出深度
      bevelEnabled: true, // 启用斜面
      bevelSegments: 10, // 斜面分段
      bevelSize: 1, // 斜面大小
      bevelThickness: 1, // 斜面厚度
    };

    return (
      <mesh
        position={[ // 设置网格位置
          -backHeight + midMidOffset,
          radius * 2 + bezelSize * 2 + props.caseHeight / 2,
          0,
        ]}
        scale={1}
        rotation={[Math.PI / 2, heartAngle, Math.PI / 2]} // 设置旋转
      >
        <extrudeGeometry
          attach="geometry"
          args={[heartShape, extrudeSettings]} // 创建几何体
        />
        <meshPhongMaterial color={props.color} transparent={true} opacity={1} /> {/* 创建材料 */}
      </mesh>
    );
  },
  shallowEqual, // 使用浅比较以优化性能
);

// 创建形状2的函数
const makeShape2 = (layoutHeight: number) => {
  const offsetXMultiplier = Math.tan((Math.PI * 7.5) / 180); // 计算X偏移量
  const bottomWidth = 10; // 底部宽度
  const topWidth = bottomWidth + offsetXMultiplier * layoutHeight; // 顶部宽度
  const halfY = layoutHeight / 2; // 一半的高度
  const path = new Shape(); // 创建Shape对象
  let radius = 2; // 圆角半径

  let baseAngle = Math.PI / 2; // 基础角度

  // 生成形状路径
  path.moveTo(-topWidth, halfY); // 移动到顶部左侧
  path.absarc(
    -topWidth - radius,
    halfY - radius,
    radius,
    baseAngle * 1 + baseAngle,
    baseAngle * 1,
    true,
  );
  path.absarc(
    -radius,
    halfY,
    radius,
    baseAngle * 1,
    baseAngle * 1 - baseAngle,
    true,
  );
  path.absarc(
    -radius,
    -halfY,
    radius,
    baseAngle * 3 + baseAngle,
    baseAngle * 3,
    true,
  );
  path.absarc(
    -bottomWidth - radius,
    -halfY - radius,
    radius,
    baseAngle * 2 + baseAngle,
    baseAngle * 2,
    true,
  );

  return path; // 返回生成的路径
};

// Case组件，用于渲染整个外壳
export const Case = React.memo((props: {width: number; height: number}) => {
  const theme = useAppSelector(getSelectedTheme); // 从store中获取当前选中主题
  const outsideColor = useMemo(() => theme[KeyColorType.Accent].c, [theme]); // 获取外部颜色
  const innerColor = '#100f0f'; // 内部颜色
  const heartColor = useMemo(() => theme[KeyColorType.Accent].t, [theme]); // 获取心形颜色
  const properWidth =
    props.width * KeycapMetric.keyXPos - KeycapMetric.keyXSpacing; // 计算合适的宽度
  const properHeight =
    KeycapMetric.keyYPos * props.height - KeycapMetric.keyYSpacing; // 计算合适的高度
  const insideBorder = 4; // 内部边框
  const insideCaseThickness = properWidth + insideBorder * 1; // 内部壳体厚度
  const outsideCaseThickness = properWidth + insideBorder * 2.5; // 外部壳体厚度
  const [insideShape, outsideShape] = useMemo(() => {
    // 生成内部和外部形状
    return [properHeight + insideBorder, properHeight + insideBorder * 2].map(
      makeShape2,
    );
  }, [properHeight]);
  const bezelSize = 1; // 边框大小
  const bevelSegments = 10; // 斜面分段
  // TODO: 心形定位
  const offsetXMultiplier = Math.tan((Math.PI * 7.5) / 180); // 计算X偏移量
  const bottomWidth = 10; // 底部宽度
  const heartCaseWidth =
    bottomWidth + offsetXMultiplier * (properHeight + insideBorder * 2); // 计算心形外壳宽度

  return (
    <group scale={1} position-z={-bezelSize * 2} rotation-y={-Math.PI / 2}> {/* 创建组并设置位置和旋转 */}
      <Heart
        caseWidth={heartCaseWidth} // 传递心形外壳宽度
        caseHeight={properHeight} // 传递心形高度
        color={heartColor} // 传递心形颜色
      />
      {/* 渲染外部形状 */}
      <mesh
        position={[-bezelSize, 0, -outsideCaseThickness / 2]} // 设置位置
        castShadow={true} // 允许投射阴影
      >
        <extrudeGeometry
          attach="geometry"
          args={[
            outsideShape,
            {
              depth: outsideCaseThickness, // 设置深度
              bevelEnabled: true, // 启用斜面
              bevelSize: bezelSize, // 斜面大小
              bevelThickness: bezelSize, // 斜面厚度
              bevelSegments, // 斜面分段
            },
          ]}
        />
        <meshPhongMaterial
          color={outsideColor} // 设置颜色
          shininess={100} // 光泽度
          reflectivity={1} // 反射率
          specular={getDarkenedColor(outsideColor, 0.2)} // 镜面反射色
        />
      </mesh>
      {/* 渲染内部形状 */}
      <mesh position={[0, 0, -insideCaseThickness / 2]} castShadow={true}>
        <extrudeGeometry
          attach="geometry"
          args={[
            insideShape,
            {
              depth: insideCaseThickness, // 设置深度
              bevelEnabled: true, // 启用斜面
              bevelSize: bezelSize / 2, // 斜面大小
              bevelThickness: bezelSize, // 斜面厚度
              bevelSegments, // 斜面分段
            },
          ]}
        />
        <meshPhongMaterial
          color={innerColor} // 设置颜色
          shininess={100} // 光泽度
          reflectivity={1} // 反射率
          specular={getDarkenedColor(outsideColor, 0.2)} // 镜面反射色
        />
      </mesh>
    </group>
  );
});

