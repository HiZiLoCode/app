import React, { createRef, useEffect } from 'react';
import styled from 'styled-components';
import { getByteForCode } from '../utils/key';
import { startMonitoring, usbDetect } from '../utils/usb-hid';
import {
  getLightingDefinition,
  isVIADefinitionV2,
  isVIADefinitionV3,
  LightingValue,
} from '@the-via/reader';
import {
  getConnectedDevices,
  getSelectedKeyboardAPI,
} from 'src/store/devicesSlice';
import {
  loadSupportedIds,
  reloadConnectedDevices,
} from 'src/store/devicesThunks';
import { getDisableFastRemap } from '../store/settingsSlice';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  getSelectedKey,
  getSelectedLayerIndex,
  updateSelectedKey as updateSelectedKeyAction,
} from 'src/store/keymapSlice';
import {
  getBasicKeyToByte,
  getSelectedDefinition,
  getSelectedKeyDefinitions,
} from 'src/store/definitionsSlice';
import { OVERRIDE_HID_CHECK } from 'src/utils/override';
import { KeyboardValue } from 'src/utils/keyboard-api';
import { useTranslation } from 'react-i18next';

// 定义错误页面的样式
const ErrorHome = styled.div`
  background: var(--bg_gradient);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  overflow: hidden;
  height: auto;
  left: 0;
  right: 0;
  bottom: 0;
  padding-top: 24px;
  position: absolute;
  border-top: 1px solid var(--border_color_cell);
`;

// 定义USB错误信息的样式
const UsbError = styled.div`
  align-items: center;
  display: flex;
  color: var(--color_label);
  flex-direction: column;
  height: 100%;
  justify-content: center;
  margin: 0 auto;
  max-width: 650px;
  text-align: center;
`;

// 定义USB错误图标的样式
const UsbErrorIcon = styled.div`
  font-size: 2rem;
`;

// 定义USB错误标题的样式
const UsbErrorHeading = styled.h1`
  margin: 1rem 0 0;
`;

// 定义USB错误链接的样式
const UsbErrorWebHIDLink = styled.a`
  text-decoration: underline;
  color: var(--color_label-highlighted);
`;

// 定义一个重复执行函数的工具函数
const timeoutRepeater =
  (fn: () => void, timeout: number, numToRepeat = 0) =>
  () =>
    setTimeout(() => {
      fn();
      if (numToRepeat > 0) {
        timeoutRepeater(fn, timeout, numToRepeat - 1)();
      }
    }, timeout);

interface HomeProps {
  children?: React.ReactNode;
  hasHIDSupport: boolean; // 是否支持HID设备               
}

// Home组件
export const Home: React.FC<HomeProps> = (props) => {
  const { hasHIDSupport } = props; // 从props中获取HID支持状态
  
  const dispatch = useAppDispatch(); // 获取redux的dispatch方法
  const selectedKey = useAppSelector(getSelectedKey); // 获取选中的按键
  const selectedDefinition = useAppSelector(getSelectedDefinition); // 获取选中的定义
  const connectedDevices = useAppSelector(getConnectedDevices); // 获取已连接的设备
  const selectedLayerIndex = useAppSelector(getSelectedLayerIndex); // 获取选中的层级
  const selectedKeyDefinitions = useAppSelector(getSelectedKeyDefinitions); // 获取选中的按键定义
  const disableFastRemap = useAppSelector(getDisableFastRemap); // 获取是否禁用快速重映射
  const { basicKeyToByte } = useAppSelector(getBasicKeyToByte); // 获取基本按键到字节的映射
  const api = useAppSelector(getSelectedKeyboardAPI); // 获取选中的键盘API
  
  // 定义一个函数，用于定时重复执行设备重载操作
  const updateDevicesRepeat: () => void = timeoutRepeater(
    () => {
      dispatch(reloadConnectedDevices()); // 重新加载连接的设备
    },
    500,
    1,
  );

  // 切换灯光效果的函数
  const toggleLights = async () => {
    if (!api || !selectedDefinition) {
      return;
    }

    const delay = 200;

    // 如果是VIA V2定义，并且支持背光效果
    if (
      isVIADefinitionV2(selectedDefinition) &&
      getLightingDefinition(
        selectedDefinition.lighting,
      ).supportedLightingValues.includes(LightingValue.BACKLIGHT_EFFECT)
    ) {
      const val = await api.getRGBMode(); // 获取当前RGB模式
      const newVal = val !== 0 ? 0 : 1; // 切换模式值
      for (let i = 0; i < 3; i++) {
        api.timeout(i === 0 ? 0 : delay); // 设置超时
        api.setRGBMode(newVal); // 设置新的RGB模式
        api.timeout(delay); // 设置超时
        await api.setRGBMode(val); // 恢复原模式
      }
    }

    // 如果是VIA V3定义
    if (isVIADefinitionV3(selectedDefinition)) {
      for (let i = 0; i < 6; i++) {
        api.timeout(i === 0 ? 0 : delay); // 设置超时
        await api.setKeyboardValue(KeyboardValue.DEVICE_INDICATION, i); // 设置设备指示灯值
      }
    }
  };

  const homeElem = createRef<HTMLDivElement>(); // 创建一个引用，用于访问DOM元素

  useEffect(() => {
    if (!hasHIDSupport) {
      return;
    }

    if (homeElem.current) {
      homeElem.current.focus(); // 使元素获取焦点
    }

    startMonitoring(); // 开始监控USB设备
    
    usbDetect.on('change', updateDevicesRepeat); // 监听USB设备变化
    dispatch(loadSupportedIds()); // 加载支持的ID

    return () => {
      // 清理函数，相当于componentWillUnmount
      usbDetect.off('change', updateDevicesRepeat); // 移除USB设备变化监听
    };
  }, []); // 空数组作为第二个参数，使得这个副作用函数只在组件挂载时执行一次

  useEffect(() => {
    dispatch(updateSelectedKeyAction(null)); // 更新选中的按键为空

    // 仅在多个设备连接时触发灯光闪烁（注释掉的部分）
    // if (Object.values(connectedDevices).length > 1) {
    //   toggleLights();
    // }
  }, [api]); // 依赖于api，每次api变化时执行

  const { t } = useTranslation(); // 获取翻译函数

  return !hasHIDSupport && !OVERRIDE_HID_CHECK ? (
    <ErrorHome ref={homeElem} tabIndex={0}>
      <UsbError>
        <UsbErrorIcon>❌</UsbErrorIcon>
        <UsbErrorHeading>{t('USB Detection Error')}</UsbErrorHeading>
        <p>
          {t('Looks like there was a problem getting USB detection working. Rightnow, we only support')}{' '}
          <UsbErrorWebHIDLink
            href="https://caniuse.com/?search=webhid"
            target="_blank"
          >
            {t('browsers that have WebHID enabled')}
          </UsbErrorWebHIDLink>
          , {t('so make sure yours is compatible before trying again.')}
        </p>
      </UsbError>
    </ErrorHome>
  ) : (
    <>{props.children}</> // 渲染子组件
  );
};
