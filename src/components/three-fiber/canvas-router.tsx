import {Canvas} from '@react-three/fiber';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  getCustomDefinitions,
  getSelectedDefinition,
} from 'src/store/definitionsSlice';
import {useSize} from 'src/utils/use-size';
import {useLocation} from 'wouter';
import {Camera} from './camera';
import {ConfigureKeyboard, Design, Test} from '../n-links/keyboard';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {
  Html,
  OrbitControls,
  SpotLight,
  useGLTF,
  useProgress,
} from '@react-three/drei';
import {
  getLoadProgress,
  updateSelectedKey,
  getConfigureKeyboardIsSelectable,
} from 'src/store/keymapSlice';
import {a, config, useSpring} from '@react-spring/three';
import React from 'react';
import {shallowEqual} from 'react-redux';
import {Object3D} from 'three';
import {DefinitionVersionMap, KeyColorType} from '@the-via/reader';
import {UpdateUVMaps} from './update-uv-maps';
import {
  getDesignDefinitionVersion,
  getSelectedTheme,
} from 'src/store/settingsSlice';
import glbSrc from 'assets/models/keyboard_components.glb';
import cubeySrc from 'assets/models/cubey.glb';
import {AccentButtonLarge} from '../inputs/accent-button';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {reloadConnectedDevices} from 'src/store/devicesThunks';
import {faSpinner, faUnlock} from '@fortawesome/free-solid-svg-icons';
import {LoaderCubey} from './loader-cubey';
import {OVERRIDE_HID_CHECK} from 'src/utils/override';
import { useTranslation } from 'react-i18next';

// 预加载 GLTF 模型
useGLTF.preload(cubeySrc);
useGLTF.preload(glbSrc);

// 创建 KeyboardBG 组件，作为键盘背景
const KeyboardBG: React.FC<{
  color: string;
  onClick: () => void;
  visible: boolean;
}> = React.memo((props) => {
  const {onClick, visible, color} = props;
  return (
    <mesh
      receiveShadow
      position={[0, -5.75, 0]}
      rotation={[-Math.PI / 2 + Math.PI / 14, 0, 0]}
      onClick={onClick}
      visible={visible}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}, shallowEqual);

// 主 CanvasRouter 组件
export const CanvasRouter = () => {
  // 获取当前路径
  const [path] = useLocation();
  // 用于引用文档的 body 元素
  const body = useRef(document.body);
  // 用于引用 Canvas 容器的 DOM 元素
  const containerRef = useRef(null);
  // 从 Redux 获取加载进度
  const loadProgress = useAppSelector(getLoadProgress);
  // 使用 useProgress 获取加载进度，通常用于加载 3D 模型
  const {progress} = useProgress();
  // 使用 Redux 的 dispatch 函数来分发动作
  const dispatch = useAppDispatch();
  // 获取容器的尺寸
  const dimensions = useSize(body);
  // 从 Redux 获取本地定义的集合
  const localDefinitions = Object.values(useAppSelector(getCustomDefinitions));
  // 从 Redux 获取选中的定义
  const selectedDefinition = useAppSelector(getSelectedDefinition);
  // 从 Redux 获取当前的定义版本
  const definitionVersion = useAppSelector(getDesignDefinitionVersion);
  // 从 Redux 获取当前的主题
  const theme = useAppSelector(getSelectedTheme);
  console.log(theme,'theme');
  
  // 计算强调颜色
  const accentColor = useMemo(() => theme[KeyColorType.Accent].c, [theme]);
  // 用于跟踪字体是否已经加载完成
  const [fontLoaded, setLoaded] = useState(false);
  // 控制是否显示加载器
  const showLoader = path === '/' && (!selectedDefinition || loadProgress !== 1);
  // 获取版本定义
  const versionDefinitions: DefinitionVersionMap[] = useMemo(
    () => localDefinitions.filter(
      (definitionMap) => definitionMap[definitionVersion],
    ),
    [localDefinitions, definitionVersion],
  );
  console.log(versionDefinitions);
  
  // 判断是否隐藏设计场景
  const hideDesignScene = '/design' === path && !versionDefinitions.length;
  // 判断是否隐藏配置场景
  const hideConfigureScene =
    '/' === path &&
    (!selectedDefinition || (loadProgress + progress / 100) / 2 !== 1);
  // 处理点击地形的回调
  const terrainOnClick = useCallback(() => {
    if (true) {
      dispatch(updateSelectedKey(null)); // 更新选中的键
    }
  }, [dispatch]);
  // 判断是否显示授权按钮
  const showAuthorizeButton = 'hid' in navigator || OVERRIDE_HID_CHECK;
  // 判断是否隐藏 Canvas 场景
  const hideCanvasScene =
    !showAuthorizeButton ||
    ['/settings', '/errors'].includes(path) ||
    hideDesignScene ||
    hideConfigureScene;
  // 从 Redux 获取是否可选择的配置键盘的状态
  const configureKeyboardIsSelectable = useAppSelector(
    getConfigureKeyboardIsSelectable,
  );

  // 是否隐藏地形背景
  const hideTerrainBG = showLoader;
  
  useEffect(() => {
    // 加载字体并设置字体加载状态
    document.fonts.load('bold 16px Fira Sans').finally(() => {
      setLoaded(true);
    });
  }, []);
  
  const { t } = useTranslation(); // 使用翻译函数
  
  return (
    <>
      {/* 更新 UV 映射 */}
      <UpdateUVMaps />
      <div
        style={{
          height: 500,
          width: '100%',
          top: 0,
          transform: hideCanvasScene
            ? !hideTerrainBG
              ? 'translateY(-500px)' // 如果隐藏 Canvas 场景且地形背景不隐藏，向上移动
              : !dimensions
              ? ''
              : `translateY(${-300 + dimensions!.height / 2}px)` // 根据容器尺寸计算位置
            : '',
          position: hideCanvasScene && !hideTerrainBG ? 'absolute' : 'relative',
          overflow: 'visible',
          zIndex: 0,
          visibility: hideCanvasScene && !hideTerrainBG ? 'hidden' : 'visible',
        }}
        ref={containerRef}
      >
        <Canvas flat={true} shadows style={{overflow: 'visible'}}>
          {/* 渲染灯光组件 */}
          <Lights />
          {/* 渲染键盘背景 */}
          <KeyboardBG
            onClick={terrainOnClick}
            color={accentColor}
            visible={!hideTerrainBG}
          />
          {/* 禁用 OrbitControls */}
          <OrbitControls enabled={false} />
          {/* 渲染相机组件 */}
          <Camera />
          {/* 渲染 Cubey 加载器 */}
            <LoaderCubey
              theme={theme}
              visible={hideTerrainBG && !selectedDefinition}
            />
          {/* 渲染 HTML 元素 */}
          <Html
            center
            position={[0, hideTerrainBG ? (!selectedDefinition ? -1 : 0) : 10, -19]}
          >
            {showAuthorizeButton ? (
              !selectedDefinition ? (
                <AccentButtonLarge
                  onClick={() => dispatch(reloadConnectedDevices())}
                  style={{width: 'max-content'}}
                >
                 {t('Authorize device')} {/* 译文: 授权设备 */}
                  <FontAwesomeIcon
                    style={{marginLeft: '10px'}}
                    icon={faUnlock}
                  />
                </AccentButtonLarge>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    color: 'var(--color_accent)',
                    fontSize: 60,
                  }}
                >
                  <FontAwesomeIcon spinPulse icon={faSpinner} />
                </div>
              )
            ) : null}
          </Html>
          {/* 仅当字体加载完成时才渲染 KeyboardGroup */}
          {fontLoaded ? (
            <KeyboardGroup
              containerRef={containerRef}
              configureKeyboardIsSelectable={configureKeyboardIsSelectable}
              loadProgress={loadProgress}
            />
          ) : null}
        </Canvas>
      </div>
    </>
  );
};


// 设置灯光组件
const Lights = React.memo(() => {
  // 定义灯光的位置和属性
  const x = 3; // 点光源 X 轴位置
  const y = 0.5; // 点光源 Y 轴位置
  const z = -15; // 点光源 Z 轴位置
  const spotlightY = 12; // 聚光灯 Y 轴位置
  const spotlightZ = -19; // 聚光灯 Z 轴位置

  // 创建一个对 SpotLight 的引用
  const ref = useRef<THREE.SpotLight>(null);

  useEffect(() => {
    // 设置 SpotLight 的阴影映射尺寸
    if (ref.current) {
      ref.current.shadow.mapSize.width = 2048;
      ref.current.shadow.mapSize.height = 2048;
    }
  }, [ref.current]); // 当 ref.current 变化时执行

  // 创建一个目标对象，用于聚光灯的目标
  const targetObj = React.useMemo(() => {
    const obj = new Object3D();
    obj.position.set(0, 0, spotlightZ);
    obj.updateMatrixWorld();
    return obj;
  }, []); // 目标对象只需创建一次

  // 根据性能设置灯光
  const renderAllLights = true; // 控制是否渲染所有灯光

  return renderAllLights ? (
    <>
      {/* 环境光，强度为 0.0（不渲染环境光） */}
      <ambientLight intensity={0.0} />
      {/* 聚光灯设置 */}
      <SpotLight
        ref={ref}
        distance={spotlightY + 3} // 聚光灯的光照距离
        position={[0, spotlightY, spotlightZ + 2]} // 聚光灯的位置
        angle={Math.PI / 5} // 聚光灯的光锥角度
        attenuation={5} // 聚光灯的衰减系数
        target={targetObj} // 聚光灯的目标对象
        intensity={10} // 聚光灯的光照强度
        castShadow={true} // 是否投射阴影
        anglePower={5} // 扩散角度功率（默认为 5）
      />
      {/* 两个点光源 */}
      <pointLight position={[x, y, z]} intensity={0.8} />
      <pointLight position={[-x, y, z]} intensity={0.8} />
    </>
  ) : (
    <>
      {/* 环境光，强度为 0.4（弱环境光） */}
      <ambientLight intensity={0.4} />
      {/* 单个点光源 */}
      <pointLight position={[-0.5, y, z]} intensity={1.5} />
    </>
  );
}, shallowEqual); // 使用 shallowEqual 避免不必要的重渲染


// 根据路由获取位置
const getRouteX = (route: string) => {
  const configurePosition = 0;
  const spaceMultiplier = 20;
  const testPosition = -spaceMultiplier * 1;
  const designPosition = -spaceMultiplier * 2;
  const debugPosition = -spaceMultiplier * 3;
  const otherPosition = -spaceMultiplier * 3;
  switch (route) {
    case '/debug': {
      return debugPosition;
    }
    case '/design': {
      return designPosition;
    }
    case '/test': {
      return testPosition;
    }
    case '/': {
      return configurePosition;
    }
    default: {
      return otherPosition;
    }
  }
};

// 处理键盘组
const KeyboardGroup = React.memo((props: any) => {
  // 从 props 中解构出 loadProgress 和 configureKeyboardIsSelectable
  const {loadProgress, configureKeyboardIsSelectable} = props;
  // 使用 useLocation 钩子获取当前路径
  const [path] = useLocation();
  // 根据当前路径获取相应的位置
  const routeX = getRouteX(path); // 获取路由对应的位置
  console.log(routeX);
  
  // 使用 useSpring 钩子创建动画效果
  const slide = useSpring({
    config: config.stiff, // 动画的配置，使用 stiff 作为动画配置
    x: routeX, // 动画的目标位置，根据路由动态变化
  });

  // 使用 useSize 钩子获取容器的尺寸
  const dimensions = useSize(props.containerRef); // 获取容器尺寸

  return (
    // 使用 a.group 组件应用动画效果，position-x 用于控制 X 轴位置
    <a.group position-x={slide.x}>
      {/* 渲染 Keyboards 组件，并传递所需的 props */}
      <Keyboards
        configureKeyboardIsSelectable={configureKeyboardIsSelectable} // 配置键盘是否可选择
        loadProgress={loadProgress} // 加载进度
        dimensions={dimensions} // 容器尺寸
      />
    </a.group>
  );
}, shallowEqual); // 使用 shallowEqual 避免不必要的重渲染


// 渲染键盘组件
const Keyboards = React.memo((props: any) => {
  // 从 props 中解构出 loadProgress、dimensions 和 configureKeyboardIsSelectable
  const {loadProgress, dimensions, configureKeyboardIsSelectable} = props;
  
  // 根据路由位置计算不同视图的位置
  const testPosition = -getRouteX('/test'); // 获取测试视图的位置
  const designPosition = -getRouteX('/design'); // 获取设计视图的位置
  const debugPosition = -getRouteX('/debug'); // 获取调试视图的位置

  return (
    <>
      {/* 仅在加载进度为 1 时显示 ConfigureKeyboard 组件 */}
      <group visible={loadProgress === 1}>
        <ConfigureKeyboard
          dimensions={dimensions} // 传递容器尺寸
          selectable={configureKeyboardIsSelectable} // 配置键盘是否可选择
          nDimension={'3D'} // 设置维度为 3D
        />
      </group>
      {/* 渲染测试视图，并设置位置 */}
      <group position-x={testPosition}>
        <Test dimensions={dimensions} nDimension={'3D'} />
      </group>
      {/* 渲染设计视图，并设置位置 */}
      <group position-x={designPosition}>
        <Design dimensions={dimensions} nDimension={'3D'} />
      </group>
      {/* 渲染调试视图，并设置位置 */}
      <group position-x={debugPosition}></group>
    </>
  );
}, shallowEqual); // 使用 shallowEqual 避免不必要的重渲染

