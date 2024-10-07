// import {PresentationControls, useGLTF} from '@react-three/drei';
import React, {useRef} from 'react';
import cubeySrc from 'assets/models/cubey.glb';
import {useFrame} from '@react-three/fiber';
import {shallowEqual} from 'react-redux';
import { OrbitControls,PresentationControls,useGLTF} from '@react-three/drei'; 
import * as THREE from 'three';
import {Color, Mesh, MeshBasicMaterial, MeshStandardMaterial} from 'three';
import {Theme} from 'src/utils/themes';
import {getDarkenedColor} from 'src/utils/color-math';

// LoaderCubey 组件
export const LoaderCubey: React.FC<{theme: Theme; visible: boolean}> =
  React.memo(({visible, theme}) => {
    // // 使用 useGLTF 加载 GLTF 模型
    const cubeyGLTF = useGLTF(cubeySrc);
    
    // // 创建一个引用，用于控制模型旋转和位置
    const spinnerRef = useRef<any>();
    const yInit = !visible ? 10 : -0.3;

    // 计算并设置颜色z
    const darkAccent = getDarkenedColor(theme.accent.c, 0.8);
    const colorMap = {  
      'upper-body': new Color(theme.mod.c),
      'lower-body': new Color(theme.mod.t),
      accent: new Color(darkAccent),
      bowtie: new Color(darkAccent),
    };

    // 为模型的每个部分设置颜色
    
    cubeyGLTF.scene.children.forEach((child) => {
      const bodyPart = child.name.split('_')[0] as keyof typeof colorMap;
      const color = colorMap[bodyPart];
      if (color) {
        ((child as Mesh).material as MeshBasicMaterial).color = color;
      }
    });
    console.log('scene', cubeyGLTF.scene);
    
    // 在每一帧更新模型的旋转和位置
    useFrame(({clock}) => {
      if (visible) {
        spinnerRef.current.rotation.z =
          Math.sin(clock.elapsedTime) * (Math.PI / 40); // z轴旋转
        spinnerRef.current.rotation.y =
          Math.PI + Math.sin(0.6 * clock.elapsedTime) * (Math.PI / 16); // y轴旋转
        spinnerRef.current.position.y =
          yInit + 0.2 * Math.sin(clock.elapsedTime); // y轴位置变化
      }
    });
    
    return (
      <>
        <group scale={0.6} position={[0, yInit, -19]}>
          <PresentationControls
            enabled={true} // 控件是否启用
            global={true} // 是否全局旋转模型，或通过拖动模型
            snap={true} // 是否在回到中心时进行快照（也可以是弹簧配置）
            speed={1} // 旋转速度因子
            zoom={1} // 当极轴最大值的一半时的缩放因子
            rotation={[0, 0, 0]} // 默认旋转角度
            polar={[-Math.PI / 3, Math.PI / 3]} // 垂直方向限制
            config={{mass: 2, tension: 200, friction: 14}} // 弹簧配置
          >
            <group ref={spinnerRef}>
            <primitive object={cubeyGLTF.scene} />
            {/* <OrbitControls maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
            <ambientLight intensity={0.5} />
            <LogoShape /> */}
            </group>
             
            {/* <group ref={spinnerRef}>
              <primitive object={cubeyGLTF.scene} />
            </group> */}
          </PresentationControls>
        </group>
      </>
    );
  }, shallowEqual);
