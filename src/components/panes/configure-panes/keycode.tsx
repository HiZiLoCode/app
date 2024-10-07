import {FC, useState, useEffect, useMemo} from 'react';
import styled from 'styled-components';
import {Button} from '../../inputs/button';
import {KeycodeModal} from '../../inputs/custom-keycode-modal';
import {title, component} from '../../icons/keyboard';
import * as EncoderPane from './encoder';
import {
  keycodeInMaster,
  getByteForCode,
  getKeycodes,
  getOtherMenu,
  IKeycode,
  IKeycodeMenu,
  categoriesForKeycodeModule,
} from '../../../utils/key';
import {ErrorMessage} from '../../styled';
import {
  KeycodeType,
  getLightingDefinition,
  isVIADefinitionV3,
  isVIADefinitionV2,
  VIADefinitionV3,
} from '@the-via/reader';
import {OverflowCell, SubmenuOverflowCell, SubmenuRow} from '../grid';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {
  getBasicKeyToByte,
  getSelectedDefinition,
  getSelectedKeyDefinitions,
} from 'src/store/definitionsSlice';
import {getSelectedConnectedDevice} from 'src/store/devicesSlice';
import {
  getSelectedKey,
  getSelectedKeymap,
  updateKey as updateKeyAction,
  updateSelectedKey,
} from 'src/store/keymapSlice';
import {
  getMacroCount,
} from 'src/store/macrosSlice';
import {
  disableGlobalHotKeys,
  enableGlobalHotKeys,
  getDisableFastRemap,
} from 'src/store/settingsSlice';
import {getNextKey} from 'src/utils/keyboard-rendering';
import { useTranslation } from 'react-i18next';
const KeycodeList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, 64px);
  grid-auto-rows: 64px;
  justify-content: center;
  grid-gap: 10px;
`;

const MenuContainer = styled.div`
  padding: 15px 20px 20px 10px;
`;

const Keycode = styled(Button)<{disabled: boolean}>`
  width: 50px;
  height: 50px;
  line-height: 18px;
  border-radius: 64px;
  font-size: 14px;
  border: 4px solid var(--border_color_icon);
  background: var(--bg_control);
  color: var(--color_label-highlighted);
  margin: 0;
  box-shadow: none;
  position: relative;
  border-radius: 10px;
  &:hover {
    border-color: var(--color_accent);
    transform: translate3d(0, -2px, 0);
  }
  ${(props: any) => props.disabled && `cursor:not-allowed;filter:opacity(50%);`}
`;

const KeycodeContent = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
`;

const CustomKeycode = styled(Button)`
  width: 50px;
  height: 50px;
  line-height: 18px;
  border-radius: 10px;
  font-size: 14px;
  border: 4px solid var(--border_color_icon);
  background: var(--color_accent);
  border-color: var(--color_inside_accent);
  color: var(--color_inside_accent);
  margin: 0;
`;

const KeycodeContainer = styled.div`
  padding: 12px;
  padding-bottom: 30px;
`;

const KeycodeDesc = styled.div`
  position: fixed;
  bottom: 0;
  background: #d9d9d97a;
  box-sizing: border-box;
  transition: opacity 0.4s ease-out;
  height: 25px;
  width: 100%;
  line-height: 14px;
  padding: 5px;
  font-size: 14px;
  opacity: 1;
  pointer-events: none;
  &:empty {
    opacity: 0;
  }
`;
// 生成键码类别函数，结合基本键码映射表和宏键数量
const generateKeycodeCategories = (basicKeyToByte: Record<string, number>, numMacros: number = 16) =>{
  console.log('basicKeyToByte----',basicKeyToByte, numMacros,getKeycodes(numMacros),getKeycodes(numMacros).concat(getOtherMenu(basicKeyToByte)));
  
  return getKeycodes(numMacros).concat(getOtherMenu(basicKeyToByte));
}
// 生成键码类别，将宏键（numMacros）与其他键菜单（basicKeyToByte）结合在一起
 
// 可能的过滤器函数，根据条件 maybe 决定是否应用过滤器
const maybeFilter = <M extends Function>(maybe: boolean, filter: M) =>
  maybe ? () => true : filter;
// 如果 maybe 为 true，则返回一个始终为 true 的过滤器函数，否则返回提供的过滤器

// React 组件 Pane 的定义
export const Pane: FC = () => {
  const selectedKey = useAppSelector(getSelectedKey); // 从状态中获取当前选中的键
  const dispatch = useAppDispatch(); // 获取 dispatch 函数用于更新状态
  const keys = useAppSelector(getSelectedKeyDefinitions); // 从状态中获取键定义

  // 使用 useEffect 钩子，在组件卸载时重置选中的键
  useEffect(
    () => () => {
      dispatch(updateSelectedKey(null)); // 组件卸载时将选中的键重置为 null
    },
    [], // 空依赖数组表示只在组件首次挂载和卸载时执行
  ); // 相当于 componentWillUnmount

  // 如果有选中的键，并且键的 "ei" 属性不为 undefined，则渲染 EncoderPane.Pane 组件
  if (selectedKey !== null && keys[selectedKey].ei !== undefined) {
    return <EncoderPane.Pane />;
  }

  // 否则渲染 KeycodePane 组件
  return <KeycodePane />;
};

export const KeycodePane: FC = () => {
  const dispatch = useAppDispatch(); // 用于触发 Redux 中的动作
  const macros = useAppSelector((state: any) => state.macros); // 宏设置
  const selectedDefinition = useAppSelector(getSelectedDefinition); // 当前选择的键盘定义
  const selectedDevice = useAppSelector(getSelectedConnectedDevice); // 当前连接的设备
  const matrixKeycodes = useAppSelector(getSelectedKeymap); // 键盘的按键映射
  const selectedKey = useAppSelector(getSelectedKey); // 当前选中的按键
  const disableFastRemap = useAppSelector(getDisableFastRemap); // 是否禁用快速重映射的状态
  const selectedKeyDefinitions = useAppSelector(getSelectedKeyDefinitions); // 选中按键的定义
  const { basicKeyToByte } = useAppSelector(getBasicKeyToByte); // 将基本按键转换为字节的函数
  const macroCount = useAppSelector(getMacroCount); // 定义的宏数量

  console.log(macroCount); // 调试输出宏数量

  // 根据状态生成按键类别
  const KeycodeCategories = useMemo(
    () => generateKeycodeCategories(basicKeyToByte, macroCount),
    [basicKeyToByte, macroCount],
  );
  
  // 如果缺少必要数据则早期返回
  if (!selectedDefinition || !selectedDevice || !matrixKeycodes) {
    return null;
  }

  // 管理选中类别和鼠标悬停描述的状态
  const [selectedCategory, setSelectedCategory] = useState(KeycodeCategories[0].id);
  const [mouseOverDesc, setMouseOverDesc] = useState<string | null>(null);
  const [showKeyTextInputModal, setShowKeyTextInputModal] = useState(false);

  // 根据当前定义确定启用的菜单
  const getEnabledMenus = (): IKeycodeMenu[] => {
    if (isVIADefinitionV3(selectedDefinition)) {
      return getEnabledMenusV3(selectedDefinition);
    }
    const { lighting, customKeycodes } = selectedDefinition;
    const { keycodes } = getLightingDefinition(lighting);

    return KeycodeCategories.filter(
      maybeFilter(keycodes === KeycodeType.QMK, ({ id }) => id !== 'qmk_lighting'),
    ).filter(
      maybeFilter(keycodes === KeycodeType.WT, ({ id }) => id !== 'lighting'),
    ).filter(
      maybeFilter(typeof customKeycodes !== 'undefined', ({ id }) => id !== 'custom'),
    );
  };

  // V3 特定的菜单过滤
  const getEnabledMenusV3 = (definition: VIADefinitionV3): IKeycodeMenu[] => {
    const keycodes = ['default' as const, ...(definition.keycodes || [])];
    const allowedKeycodes = keycodes.flatMap((keycodeName) =>
      categoriesForKeycodeModule(keycodeName),
    );

    if ((selectedDefinition.customKeycodes || []).length !== 0) {
      allowedKeycodes.push('custom');
    }

    return KeycodeCategories.filter((category) =>
      allowedKeycodes.includes(category.id),
    );
  };

  // 如果宏不受支持，渲染错误信息
  const renderMacroError = () => {
    return (
      <ErrorMessage>
        您当前的固件不支持宏。请安装您设备的最新固件。
      </ErrorMessage>
    );
  };

  const { t } = useTranslation(); // 用于国际化的翻译钩子

  // 渲染侧边栏中的类别菜单
  const renderCategories = () => {
    return (
      <MenuContainer>
        {getEnabledMenus().map(({ id, label }) => (
          <SubmenuRow
            $selected={id === selectedCategory}
            onClick={() => setSelectedCategory(id)}
            key={id}
          >
            {t(label)} {/* 翻译后的标签 */}
          </SubmenuRow>
        ))}
      </MenuContainer>
    );
  };

  // 当选择“text”按键码时显示输入模态框
  const renderKeyInputModal = () => {
    dispatch(disableGlobalHotKeys()); // 打开模态框时禁用全局热键

    return (
      <KeycodeModal
        defaultValue={selectedKey !== null ? matrixKeycodes[selectedKey] : undefined}
        onExit={() => {
          dispatch(enableGlobalHotKeys());
          setShowKeyTextInputModal(false);
        }}
        onConfirm={(keycode) => {
          dispatch(enableGlobalHotKeys());
          updateKey(keycode);
          setShowKeyTextInputModal(false);
        }}
      />
    );
  };

  // 更新 Redux 存储中的按键
  const updateKey = (value: number) => {
    if (selectedKey !== null) {
      dispatch(updateKeyAction(selectedKey, value)); // 用新值更新选中的按键
      dispatch(
        updateSelectedKey(
          disableFastRemap || !selectedKeyDefinitions
            ? null
            : getNextKey(selectedKey, selectedKeyDefinitions), // 获取下一个按键（如果启用快速重映射）
        ),
      );
    }
  };

  // 处理按键点击事件
  const handleClick = (code: string, i: number) => {
    if (code === 'text') {
      setShowKeyTextInputModal(true); // 显示文本输入模态框
    } else {
      return (
        keycodeInMaster(code, basicKeyToByte) &&
        updateKey(getByteForCode(code, basicKeyToByte)) // 如果在主列表中，则更新按键
      );
    }
  };

  // 渲染单个按键组件
  const renderKeycode = (keycode: IKeycode, index: number) => {
    const { code, title, name } = keycode;
    return (
      <Keycode
        key={code}
        disabled={!keycodeInMaster(code, basicKeyToByte) && code !== 'text'} // 如果不在主列表或不是文本则禁用
        onClick={() => handleClick(code, index)}
        onMouseOver={() => setMouseOverDesc(title ? `${code}: ${title}` : code)}
        onMouseOut={() => setMouseOverDesc(null)}
      >
        <KeycodeContent>{t(name)}</KeycodeContent>
      </Keycode>
    );
  };

  // 渲染自定义按键选项
  const renderCustomKeycode = () => {
    return (
      <CustomKeycode
        key="customKeycode"
        onClick={() => selectedKey !== null && handleClick('text', 0)}
        onMouseOver={() => setMouseOverDesc('输入任何 QMK 按键码')}
        onMouseOut={() => setMouseOverDesc(null)}
      >
        Any
      </CustomKeycode>
    );
  };

  // 根据选中类别渲染按键
  const renderSelectedCategory = (
    keycodes: IKeycode[],
    selectedCategory: string,
  ) => {
    // 将可选择的键帽渲染
    const keycodeListItems = keycodes.map((keycode, i) =>
      renderKeycode(keycode, i),
    );

    switch (selectedCategory) {
      case 'macro':
        return !macros.isFeatureSupported ? renderMacroError() : <KeycodeList>{keycodeListItems}</KeycodeList>;
      case 'special':
        return <KeycodeList>{keycodeListItems.concat(renderCustomKeycode())}</KeycodeList>;
      case 'custom':
        // 检查当前定义是否支持自定义按键
        if (
          (!isVIADefinitionV2(selectedDefinition) &&
            !isVIADefinitionV3(selectedDefinition)) ||
          !selectedDefinition.customKeycodes
        ) {
          return null;
        }
        return (
          <KeycodeList>
            {selectedDefinition.customKeycodes.map((keycode, idx) => {
              return renderKeycode(
                {
                  ...keycode,
                  code: `CUSTOM(${idx})`, // 格式化自定义按键
                },
                idx,
              );
            })}
          </KeycodeList>
        ); 
      default:
        return <KeycodeList>{keycodeListItems}</KeycodeList>;
    }
  };

  // 获取当前选中类别的按键
  const selectedCategoryKeycodes = KeycodeCategories.find(
    ({ id }) => id === selectedCategory,
  )?.keycodes as IKeycode[];
  // console.log(selectedCategoryKeycodes);
  
  return (
    <>
      <SubmenuOverflowCell>{renderCategories()}</SubmenuOverflowCell>
      <OverflowCell>
        <KeycodeContainer>
          {renderSelectedCategory(selectedCategoryKeycodes, selectedCategory)}
        </KeycodeContainer>
        <KeycodeDesc>{mouseOverDesc}</KeycodeDesc>
        {showKeyTextInputModal && renderKeyInputModal()}
      </OverflowCell>
    </>
  );
};


export const Icon = component;
export const Title = title;
