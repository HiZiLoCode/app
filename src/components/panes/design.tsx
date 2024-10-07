import { useState, FC, useRef, Dispatch, DragEvent, useMemo } from 'react';
import { Pane } from './pane'; // 导入 Pane 组件
import styled from 'styled-components'; // 导入 styled-components 用于样式
import { ErrorMessage } from '../styled'; // 导入错误信息组件
import { AccentSelect } from '../inputs/accent-select'; // 导入选择输入组件
import { AccentSlider } from '../inputs/accent-slider'; // 导入滑块组件
import { AccentUploadButton } from '../inputs/accent-upload-button'; // 导入上传按钮组件
import Layouts from '../Layouts'; // 导入布局组件
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // 导入 FontAwesome 图标组件
import { faBook, faUpload, faXmark } from '@fortawesome/free-solid-svg-icons'; // 导入图标
import {
  keyboardDefinitionV2ToVIADefinitionV2,
  isVIADefinitionV2,
  isKeyboardDefinitionV2,
  keyboardDefinitionV3ToVIADefinitionV3,
  isVIADefinitionV3,
  isKeyboardDefinitionV3,
  DefinitionVersionMap,
  VIADefinitionV2,
  VIADefinitionV3,
} from '@the-via/reader'; // 导入键盘定义相关的类型和函数
import type { DefinitionVersion } from '@the-via/reader'; // 导入类型
import {
  ControlRow,
  Label,
  SubLabel,
  Detail,
  IndentedControlRow,
  SinglePaneFlexCell,
  Grid,
  SpanOverflowCell,
  MenuCell,
  Row,
  IconContainer,
} from './grid'; // 导入网格布局相关的组件
import { useDispatch } from 'react-redux'; // 导入 Redux 的 dispatch
import { selectDevice, ensureSupportedIds } from 'src/store/devicesSlice'; // 导入设备相关的 Redux 函数
import { reloadConnectedDevices } from 'src/store/devicesThunks'; // 导入重载连接设备的异步函数
import { useAppSelector } from 'src/store/hooks'; // 导入自定义的 Redux hooks
import {
  getCustomDefinitions,
  loadCustomDefinitions,
  storeCustomDefinitions,
  unloadCustomDefinition,
} from 'src/store/definitionsSlice'; // 导入定义相关的 Redux 函数
import {
  getSelectedDefinitionIndex,
  getShowMatrix,
  updateSelectedDefinitionIndex,
  updateSelectedOptionKeys,
  updateShowMatrix,
} from 'src/store/designSlice'; // 导入设计相关的 Redux 函数
import { MenuContainer } from './configure-panes/custom/menu-generator'; // 导入菜单容器
import { MenuTooltip } from '../inputs/tooltip'; // 导入菜单提示工具
import { MessageDialog } from '../inputs/message-dialog'; // 导入消息对话框
import { IconButtonUnfilledContainer } from '../inputs/icon-button'; // 导入图标按钮容器
import { formatNumberAsHex } from 'src/utils/format'; // 导入格式化为十六进制的工具函数
import {
  getDesignDefinitionVersion,
  updateDesignDefinitionVersion,
} from 'src/store/settingsSlice'; // 导入设置相关的 Redux 函数
import { useTranslation } from 'react-i18next'; // 导入国际化支持

// 读取本地存储中的设计警告状态
let designWarningSeen = Number(localStorage.getItem('designWarningSeen') || 0);
let hideDesignWarning =
  sessionStorage.getItem('hideDesignWarning') || designWarningSeen > 4;

// 自定义错误信息样式
const DesignErrorMessage = styled(ErrorMessage)`
  margin: 0; // 无边距
  font-style: italic; // 斜体
`;

// 定义容器样式
const Container = styled.div`
  display: flex; // 使用 Flexbox 布局
  align-items: center; // 垂直居中
  flex-direction: column; // 垂直排列
  padding: 0 12px; // 设置内边距
`;

// 定义设计面板样式
const DesignPane = styled(Pane)`
  display: grid; // 使用网格布局
  max-width: 100vw; // 最大宽度为视口宽度
  grid-template-columns: 100vw; // 设置列模板
  grid-template-rows: min-content; // 设置行模板
`;

// 定义上传图标样式
const UploadIcon = styled.div`
  height: 200px; // 高度
  width: 50%; // 宽度
  cursor: pointer; // 鼠标悬停时显示指针
  max-width: 560px; // 最大宽度
  border-radius: 6px; // 圆角边框
  margin: 50px 10px; // 外边距
  animation-duration: 1.5s; // 动画持续时间
  animation-name: border-glow; // 动画名称
  animation-iteration-count: infinite; // 无限循环
  animation-direction: alternate; // 交替方向
  animation-timing-function: ease-in-out; // 动画过渡效果
  position: relative; // 相对定位
  display: flex; // 使用 Flexbox 布局
  align-items: center; // 垂直居中
  justify-content: center; // 水平居中
  svg {
    color: transparent; // 颜色透明
    stroke-width: 8px; // 描边宽度
    animation-duration: 1.5s; // 动画持续时间
    animation-name: text-glow; // 动画名称
    animation-iteration-count: infinite; // 无限循环
    animation-direction: alternate; // 交替方向
    animation-timing-function: ease-in-out; // 动画过渡效果
    font-size: 100px; // 字体大小
  }
`;

// 读取文件并返回 Promise
const makeReaderPromise = (file: File): Promise<[string, string]> => {
  return new Promise((res, rej) => {
    const reader = new FileReader(); // 创建文件读取器
    reader.onload = () => {
      if (!reader.result) return rej(); // 如果没有结果，拒绝 Promise
      res([file.name, reader.result.toString()]); // 返回文件名和内容
    };
    reader.onerror = rej; // 读取错误时拒绝 Promise
    reader.onabort = rej; // 读取中止时拒绝 Promise
    console.log(file,'file');
    
    reader.readAsBinaryString(file); // 读取文件为二进制字符串
    
  });
};

// 检查定义是否为 VAI 定义
const isVIADefinition = (
  definition: VIADefinitionV2 | VIADefinitionV3 | null | undefined,
): definition is VIADefinitionV2 | VIADefinitionV3 => {
  console.log(definition);
  
  return isVIADefinitionV2(definition) || isVIADefinitionV3(definition); // 验证定义类型
};

// 导入定义的函数
function importDefinitions(
  files: File[],
  version: DefinitionVersion,
  dispatch: Dispatch<any>,
  setErrors: (errors: string[]) => void,
) {
  console.log(files); // 输出文件信息
  
  // 读取所有文件并处理结果
  Promise.all(files.map(makeReaderPromise)).then((results) => {
    let errors: string[] = []; // 初始化错误数组
    setErrors([]); // 清空错误信息
    console.log(results);
    
    const definitions = results
      .map(([fileName, result]) => { // 遍历结果
        if (errors.length > 0) {
          return null; // 如果已有错误，则返回 null
        }
        try {
          const res = JSON.parse(result.toString()); // 解析 JSON
          console.log(res);
          
          const isValid =
            version === 'v2'
              ? isKeyboardDefinitionV2(res) || isVIADefinitionV2(res)
              : isKeyboardDefinitionV3(res) || isVIADefinitionV3(res);
          if (isValid) {
            const definition =
              version === 'v2'
                ? isVIADefinitionV2(res)
                  ? res // 如果是 V2 定义
                  : keyboardDefinitionV2ToVIADefinitionV2(res) // 转换为 V2 定义
                : isVIADefinitionV3(res)
                ? res // 如果是 V3 定义
                : keyboardDefinitionV3ToVIADefinitionV3(res); // 转换为 V3 定义
            return definition; // 返回有效定义
          } else {
            errors = (
              version === 'v2'
                ? isKeyboardDefinitionV2.errors ||
                  isVIADefinitionV2.errors ||
                  []
                : isKeyboardDefinitionV3.errors ||
                  isVIADefinitionV3.errors ||
                  []
            ).map(
              (e) =>
                `${fileName} ${e.dataPath ? e.dataPath + ': ' : 'Object: '}${
                  e.message
                }`, // 格式化错误信息
            );
          }
        } catch (err: any) {
          if (err.name) {
            errors.push(`${err.name}: ${err.message}`); // 捕获并格式化错误
          } else {
            errors.push(`${err}`); // 处理其他错误
          }
        }
      })
      .filter(isVIADefinition); // 过滤有效定义

    if (errors.length) {
      setErrors(errors); // 如果有错误，设置错误信息
    } else {
      console.log(definitions);
      
      // 如果没有错误，执行 Redux 操作
      dispatch(loadCustomDefinitions({ definitions, version }));
      dispatch(storeCustomDefinitions({ definitions, version }));
      dispatch(
        ensureSupportedIds({
          productIds: definitions.map((d) => d.vendorProductId),
          version,
        }),
      );
      dispatch(selectDevice(null)); // 选择没有设备
      dispatch(reloadConnectedDevices()); // 重载连接的设备
    }
  });
}

// 处理文件拖放事件
function onDrop(
  evt: DragEvent<HTMLElement>,
  version: DefinitionVersion,
  dispatch: Dispatch<any>,
  setErrors: (errors: string[]) => void,
) {
  evt.preventDefault(); // 阻止默认行为
  const { dataTransfer } = evt; // 获取拖放的数据
  if (dataTransfer?.items) {
    const items = Array.from(dataTransfer.items)
      .filter((item) => {
        return item.kind === 'file' && item.type === 'application/json'; // 过滤文件类型为 JSON 的项
      })
      .map((item) => item.getAsFile()) // 获取文件
      .filter((item) => item !== null); // 过滤掉 null
    if (items.length) {
      importDefinitions(items as File[], version, dispatch, setErrors); // 导入文件
    }
  }
}

// 设计选项卡组件
export const DesignTab: FC = () => {
  const dispatch = useDispatch(); // 获取 dispatch 方法
  const localDefinitions = Object.values(useAppSelector(getCustomDefinitions)); // 获取本地定义
  const definitionVersion = useAppSelector(getDesignDefinitionVersion); // 获取当前定义版本
  const selectedDefinitionIndex = useAppSelector(getSelectedDefinitionIndex); // 获取选中的定义索引
  const showMatrix = useAppSelector(getShowMatrix); // 获取显示矩阵的状态
  const [errors, setErrors] = useState<string[]>([]); // 初始化错误状态
  const versionDefinitions: DefinitionVersionMap[] = useMemo(
    () =>
      localDefinitions.filter(
        (definitionMap) => definitionMap[definitionVersion],
      ),
    [localDefinitions, definitionVersion],
  ); // 过滤当前版本的定义

  // 生成下拉选项
  const options = versionDefinitions.map((definitionMap, index) => ({
    label: definitionMap[definitionVersion].name,
    value: index.toString(),
  }));

  const flexRef = useRef(null); // 创建 ref
  const definition =
    versionDefinitions[selectedDefinitionIndex] &&
    versionDefinitions[selectedDefinitionIndex][definitionVersion]; // 获取选中的定义
  const uploadButton = useRef<HTMLInputElement>(); // 创建上传按钮的 ref
  const { t } = useTranslation(); // 使用国际化

  return (
    <DesignPane
      onDragOver={(evt: DragEvent) => {
        evt.dataTransfer.effectAllowed = 'copyMove'; // 设置拖动效果
        evt.dataTransfer.dropEffect = 'none'; // 设置放置效果
        evt.preventDefault(); // 阻止默认行为
        evt.stopPropagation(); // 阻止事件冒泡
      }}
    >
      {/* 设计警告对话框（注释掉了） */}
      {/* <MessageDialog
        isOpen={!hideDesignWarning}
        onClose={() => {
          sessionStorage.setItem('hideDesignWarning', '1');
          hideDesignWarning = '1';
          designWarningSeen = designWarningSeen + 1;
          localStorage.setItem('designWarningSeen', `${designWarningSeen}`);
        }}
      >
        This feature is intended for development purposes. If your keyboard is
        not recognized automatically by VIA, please contact your keyboard's
        manufacturer or vendor.
      </MessageDialog> */}
      <SinglePaneFlexCell ref={flexRef}>
        {!definition && (
          <UploadIcon
            onClick={() => {
              uploadButton.current && uploadButton.current.click(); // 点击上传图标触发文件选择
            }}
            onDrop={(evt) =>
              onDrop(evt, definitionVersion, dispatch, setErrors) // 处理文件拖放
            }
            onDragOver={(evt) => {
              evt.dataTransfer.effectAllowed = 'copyMove'; // 设置拖动效果
              evt.dataTransfer.dropEffect = 'copy'; // 设置放置效果
              evt.preventDefault(); // 阻止默认行为
              evt.stopPropagation(); // 阻止事件冒泡
            }}
          >
            <FontAwesomeIcon icon={faUpload} /> {/* 上传图标 */}
          </UploadIcon>
        )}
      </SinglePaneFlexCell>
      <Grid style={{ overflow: 'hidden' }}>
        <MenuCell style={{ pointerEvents: 'all' }}>
          <MenuContainer>
            <Row $selected={true}>
              <IconContainer>
                <FontAwesomeIcon icon={faBook} />
                <MenuTooltip>{t('Add Definition')}</MenuTooltip>
              </IconContainer>
            </Row>
          </MenuContainer>
        </MenuCell>
        <SpanOverflowCell>
          <Container>
            <ControlRow>
              <Label>{t('Load Draft Definition')}</Label>
              <Detail>
                <AccentUploadButton
                  multiple
                  inputRef={uploadButton}
                  onLoad={(files) => {
                    importDefinitions(
                      Array.from(files),
                      definitionVersion,
                      dispatch,
                      setErrors,
                    ); // 上传文件后调用导入函数
                  }}
                >
                  {t('Load')}
                </AccentUploadButton>
              </Detail>
            </ControlRow>
            <ControlRow>
              <Label>{t("Use V2 definitions (deprecated)")}</Label>
              <Detail>
                <AccentSlider
                  isChecked={definitionVersion === 'v2'} // 判断当前版本是否为 V2
                  onChange={(val) =>
                    dispatch(updateDesignDefinitionVersion(val ? 'v2' : 'v3')) // 更新定义版本
                  }
                />
              </Detail>
            </ControlRow>
            {definition && (
              <>
                <ControlRow>
                  <Label>{t("Shown Keyboard Definition")}</Label>
                  <Detail>
                    <AccentSelect
                      onChange={(option: any) => {
                        // 当选择不同的定义时，重置选中的布局
                        dispatch(updateSelectedOptionKeys([]));
                        if (option) {
                          dispatch(
                            updateSelectedDefinitionIndex(+option.value), // 更新选中的定义索引
                          );
                        }
                      }}
                      value={options[selectedDefinitionIndex]} // 当前选择的值
                      options={options} // 下拉选项
                    />
                  </Detail>
                </ControlRow>
              </>
            )}
            {definition && (
              <Layouts
                definition={definition} // 渲染布局组件
                onLayoutChange={(newSelectedOptionKeys) => {
                  dispatch(updateSelectedOptionKeys(newSelectedOptionKeys)); // 更新选中的选项键
                }}
              />
            )}
            {definition && (
              <ControlRow>
                <Label>{t("Show Matrix")}</Label>
                <Detail>
                  <AccentSlider
                    isChecked={showMatrix} // 判断是否显示矩阵
                    onChange={(val) => {
                      dispatch(updateShowMatrix(val)); // 更新显示矩阵状态
                    }}
                  />
                </Detail>
              </ControlRow>
            )}
            {errors.map((error: string) => (
              <IndentedControlRow key={error}>
                <DesignErrorMessage>{error}</DesignErrorMessage> {/* 显示错误信息 */}
              </IndentedControlRow>
            ))}
            <ControlRow>
              <Label>{t("Draft Definitions")}</Label>
              <Detail>
                {Object.values(versionDefinitions).length} {t('Definitions')} {/* 显示定义数量 */}
              </Detail>
            </ControlRow>
            {versionDefinitions.map((definition) => {
              return (
                <IndentedControlRow
                  key={`${definitionVersion}-${definition[definitionVersion].vendorProductId}`}
                >
                  <SubLabel>{definition[definitionVersion].name}</SubLabel> {/* 显示定义名称 */}
                  <Detail>
                    {formatNumberAsHex(
                      definition[definitionVersion].vendorProductId,
                      8,
                    )} {/* 显示产品 ID */}
                    <IconButtonUnfilledContainer
                      onClick={() => {
                        dispatch(
                          unloadCustomDefinition({
                            id: definition[definitionVersion].vendorProductId,
                            version: definitionVersion,
                          }), // 卸载自定义定义
                        );
                      }}
                      style={{ marginLeft: 10, borderRadius: 4 }}
                    >
                      <FontAwesomeIcon icon={faXmark} size={'lg'} /> {/* 删除图标 */}
                    </IconButtonUnfilledContainer>
                  </Detail>
                </IndentedControlRow>
              );
            })}
          </Container>
        </SpanOverflowCell>
      </Grid>
    </DesignPane>
  );
};
