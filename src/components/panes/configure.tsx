// 引入React及相关hook
import React, {useState, useEffect} from 'react';
// 引入FontAwesome图标
import {faPlus} from '@fortawesome/free-solid-svg-icons';
// 引入styled-components库用于样式
import styled from 'styled-components';
// 引入加载组件
import ChippyLoader from '../chippy-loader';
import LoadingText from '../loading-text';
// 引入布局组件
import {CenterPane, ConfigureBasePane} from './pane';
// 引入FontAwesomeIcon
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
// 引入自定义功能和定义判断工具
import {
  CustomFeaturesV2,
  getLightingDefinition,
  isVIADefinitionV2,
  isVIADefinitionV3,
  VIADefinitionV2,
  VIADefinitionV3,
} from '@the-via/reader';
// 引入网格布局和单元格组件
import {Grid, Row, IconContainer, MenuCell, ConfigureFlexCell} from './grid';
// 引入配置面板的不同功能模块
import * as Keycode from './configure-panes/keycode';
import * as Lighting from './configure-panes/lighting';
import * as Macros from './configure-panes/macros';
import * as SaveLoad from './configure-panes/save-load';
import * as Layouts from './configure-panes/layouts';
import * as RotaryEncoder from './configure-panes/custom/satisfaction75';
import {makeCustomMenus} from './configure-panes/custom/menu-generator';
import {LayerControl} from './configure-panes/layer-control';
import {Badge} from './configure-panes/badge';
import {AccentButtonLarge} from '../inputs/accent-button';
// 引入Redux钩子
import {useAppSelector} from 'src/store/hooks';
// 引入Redux选择器
import {getSelectedDefinition} from 'src/store/definitionsSlice';
// 引入Redux操作
import {
  clearSelectedKey,
  getLoadProgress,
  getNumberOfLayers,
  setConfigureKeyboardIsSelectable,
} from 'src/store/keymapSlice';
import {useDispatch} from 'react-redux';
// 引入设备相关的操作
import {reloadConnectedDevices} from 'src/store/devicesThunks';
import {getV3MenuComponents} from 'src/store/menusSlice';
import {getIsMacroFeatureSupported} from 'src/store/macrosSlice';
import {getConnectedDevices, getSupportedIds} from 'src/store/devicesSlice';
import {isElectron} from 'src/utils/running-context';
import {useAppDispatch} from 'src/store/hooks';
import {MenuTooltip} from '../inputs/tooltip';
import {getRenderMode, getSelectedTheme} from 'src/store/settingsSlice';
import { useTranslation } from 'react-i18next';

// 定义菜单容器的样式
const MenuContainer = styled.div`
  padding: 15px 10px 20px 10px;
`;

// 定义默认的行组件
const Rows = [
  Keycode,
  Macros,
  Layouts,
  Lighting,
  SaveLoad,
  RotaryEncoder,
  ...makeCustomMenus([]), // 动态生成自定义菜单
];

// 获取自定义面板
function getCustomPanes(customFeatures: CustomFeaturesV2[]) {
  if (
    customFeatures.find((feature) => feature === CustomFeaturesV2.RotaryEncoder)
  ) {
    return [RotaryEncoder]; // 返回旋转编码器面板
  }
  return []; // 返回空数组
}

// 获取适用于键盘的行组件
const getRowsForKeyboard = (): typeof Rows => {  
  const showMacros = useAppSelector(getIsMacroFeatureSupported); // 检查是否支持宏功能
  const v3Menus = useAppSelector(getV3MenuComponents); // 获取V3菜单组件
  const selectedDefinition = useAppSelector(getSelectedDefinition); // 获取选定的键盘定义
  const numberOfLayers = useAppSelector(getNumberOfLayers); // 获取层数
  if (!selectedDefinition) {
    return []; // 如果没有选定的定义，返回空数组
  } else if (isVIADefinitionV2(selectedDefinition)) {
    return getRowsForKeyboardV2(selectedDefinition, showMacros, numberOfLayers); // 处理V2定义
  } else if (isVIADefinitionV3(selectedDefinition)) {
    return [
      ...filterInferredRows(selectedDefinition, showMacros, numberOfLayers, [
        Keycode,
        Layouts,
        Macros,
        SaveLoad,
      ]),
      ...v3Menus, // 处理V3定义并添加菜单
    ];
  } else {
    return []; // 返回空数组
  }
};

// 过滤推断的行
const filterInferredRows = (
  selectedDefinition: VIADefinitionV3 | VIADefinitionV2,
  showMacros: boolean,
  numberOfLayers: number,
  rows: typeof Rows,
): typeof Rows => {
  const {layouts} = selectedDefinition; // 获取布局
  let removeList: typeof Rows = []; // 定义移除列表
  // 如果布局不存在，则从列表中移除
  if (
    !(layouts.optionKeys && Object.entries(layouts.optionKeys).length !== 0)
  ) {
    removeList = [...removeList, Layouts];
  }

  if (numberOfLayers === 0) { 
    removeList = [...removeList, Keycode, SaveLoad]; // 如果层数为0，则移除Keycode和SaveLoad
  }

  if (!showMacros) {
    removeList = [...removeList, Macros]; // 如果不支持宏，则移除Macros
  }
  
  let filteredRows = rows.filter(
    (row) => !removeList.includes(row), // 过滤掉移除列表中的行
  ) as typeof Rows;
  return filteredRows; // 返回过滤后的行
};

// 获取V2键盘的行
const getRowsForKeyboardV2 = (
  selectedDefinition: VIADefinitionV2,
  showMacros: boolean,
  numberOfLayers: number,
): typeof Rows => {
  let rows: typeof Rows = [Keycode, Layouts, Macros, SaveLoad]; // 默认行
  if (isVIADefinitionV2(selectedDefinition)) {
    const {lighting, customFeatures} = selectedDefinition; // 获取照明和自定义功能
    const {supportedLightingValues} = getLightingDefinition(lighting); // 获取支持的照明值
    if (supportedLightingValues.length !== 0) {
      rows = [...rows, Lighting]; // 如果有支持的照明值，则添加Lighting行
    }
    if (customFeatures) {
      rows = [...rows, ...getCustomPanes(customFeatures)]; // 添加自定义面板
    }
  }
  
  return filterInferredRows(
    selectedDefinition,
    showMacros,
    numberOfLayers,
    rows,
  ); // 过滤并返回行
};

// 加载器组件
const Loader: React.FC<{
  loadProgress: number; // 加载进度
  selectedDefinition: VIADefinitionV2 | VIADefinitionV3 | null; // 选定的键盘定义
}> = (props) => {
  const { loadProgress, selectedDefinition } = props; // 解构props，获取加载进度和选定定义
  const dispatch = useAppDispatch(); // 获取Redux的dispatch方法
  const theme = useAppSelector(getSelectedTheme); // 从Redux获取当前主题

  const connectedDevices = useAppSelector(getConnectedDevices); // 获取已连接的设备
  const supportedIds = useAppSelector(getSupportedIds); // 获取支持的设备ID
  const noSupportedIds = !Object.values(supportedIds).length; // 判断是否没有支持的ID
  const noConnectedDevices = !Object.values(connectedDevices).length; // 判断是否没有连接的设备
  const [showButton, setShowButton] = useState<boolean>(false); // 状态管理：是否显示授权按钮
  const { t, i18n } = useTranslation(); // 国际化处理

  useEffect(() => {
    // 设置延迟以显示授权按钮
    const timeout = setTimeout(() => {
      if (!selectedDefinition) {
        setShowButton(true); // 如果没有选定定义，则显示按钮
      }
    }, 3000);
    return () => clearTimeout(timeout); // 清除定时器以防内存泄漏
  }, [selectedDefinition]);

  return (
    <LoaderPane>
      {/* // 显示加载器 */}
      {<ChippyLoader theme={theme} progress={loadProgress || null} />} 
      {(showButton || noConnectedDevices) && !noSupportedIds && !isElectron ? (
        <AccentButtonLarge onClick={() => dispatch(reloadConnectedDevices())}>
          {/* // 国际化的授权设备文本 */}
          {t('Authorize device')} 
          {/* // 添加图标 */}
          <FontAwesomeIcon style={{ marginLeft: '10px' }} icon={faPlus} /> 
        </AccentButtonLarge>
      ) : (
        <LoadingText isSearching={!selectedDefinition} /> // 显示加载文本
      )}
    </LoaderPane>
  );
};

// LoaderPane的样式
const LoaderPane = styled(CenterPane)`
  display: flex; // 使用Flex布局
  align-items: center; // 垂直居中对齐
  justify-content: center; // 水平居中对齐
  row-gap: 50px; // 行间距
  position: absolute; // 绝对定位
  bottom: 50px; // 距离底部50px
  top: 50px; // 距离顶部50px
  left: 0; // 左侧对齐
  right: 0; // 右侧对齐
  z-index: 4; // 层级
`;

// 配置面板组件
export const ConfigurePane = () => {
  const selectedDefinition = useAppSelector(getSelectedDefinition); // 获取选定的定义
  const loadProgress = useAppSelector(getLoadProgress); // 获取加载进度
  const renderMode = useAppSelector(getRenderMode); // 获取渲染模式

  const showLoader = !selectedDefinition || loadProgress !== 1; // 判断是否需要显示加载器
  return showLoader ? (
    renderMode === '2D' ? (
      <Loader
        selectedDefinition={selectedDefinition || null} // 如果没有选定定义，则传null
        loadProgress={loadProgress} // 传递加载进度
      />
    ) : null
  ) : (
     // 显示配置网格
    <ConfigureBasePane>
      <ConfigureGrid />
    </ConfigureBasePane>
  );
};

// 配置网格组件
const ConfigureGrid = () => {
  const dispatch = useDispatch(); // 获取dispatch方法

  const [selectedRow, setRow] = useState(0); // 默认选中第一行
  const KeyboardRows = getRowsForKeyboard(); // 获取键盘行
  console.log('KeyboardRows---', KeyboardRows); // 打印获取到的行
  
  const SelectedPane = KeyboardRows[selectedRow]?.Pane; // 获取当前选中行的面板
  const selectedTitle = KeyboardRows[selectedRow]?.Title; // 获取当前选中行的标题

  useEffect(() => {
    // 根据选中行的标题设置是否可以选择键盘
    if (selectedTitle !== 'Keymap') {
      dispatch(setConfigureKeyboardIsSelectable(false)); // 如果不是Keymap，则不可选择
    } else {
      dispatch(setConfigureKeyboardIsSelectable(true)); // 否则可选择
    }
  }, [selectedTitle]);

  const { t, i18n } = useTranslation(); // 国际化处理
  return (
    <>
      <ConfigureFlexCell
        onClick={(evt) => {
          if ((evt.target as any).nodeName !== 'CANVAS') // 如果点击区域不是画布，则清除选择
            dispatch(clearSelectedKey());
        }}
        style={{
          pointerEvents: 'none', // 禁止事件穿透
          position: 'absolute', // 绝对定位
          top: 50, // 距离顶部50px
          left: 0, // 左侧对齐
          right: 0, // 右侧对齐
        }}
      >
        <div style={{ pointerEvents: 'all' }}>
          {/* // 层控制组件 */}
          <LayerControl /> 
          {/* // 徽章组件 */}
          <Badge /> 
        </div>
      </ConfigureFlexCell>
      <Grid style={{ pointerEvents: 'none' }}>
        <MenuCell style={{ pointerEvents: 'all' }}>
          <MenuContainer>
            {(KeyboardRows || []).map(  
              ({ Icon, Title }: { Icon: any; Title: string }, idx: number) => (
                <Row
                  key={idx}
                  onClick={(_) => setRow(idx)} // 点击行时设置选中行
                  $selected={selectedRow === idx} // 根据是否选中设置样式
                >
                  <IconContainer>
                    {/*  // 图标组件 */}
                    <Icon />
                    {/*  // 显示标题的提示 */}
                    <MenuTooltip>{t(Title)}</MenuTooltip>
                  </IconContainer>
                </Row>
              ),
            )}
          </MenuContainer>
        </MenuCell>
        {/* // 渲染选定的面板 */}
        {SelectedPane && <SelectedPane />}
      </Grid>
    </>
  );
};