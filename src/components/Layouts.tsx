import React from 'react';
import { AccentSelect } from './inputs/accent-select'; // 导入 AccentSelect 组件
import { AccentSlider } from './inputs/accent-slider'; // 导入 AccentSlider 组件
import { Detail, IndentedControlRow, Label } from './panes/grid'; // 导入布局相关的组件
import type { VIADefinitionV2, VIADefinitionV3 } from '@the-via/reader'; // 导入 VIADefinition 类型
import { useAppSelector } from 'src/store/hooks'; // 导入 Redux 的 hook
import { getDesignSelectedOptionKeys, updateSelectedOptionKeys } from 'src/store/designSlice'; // 导入 Redux 的 action 和 selector
import { useDispatch } from 'react-redux'; // 导入 useDispatch hook
import { useTranslation } from 'react-i18next'; // 导入 i18n 的 hook

interface Props {
  definition: VIADefinitionV2 | VIADefinitionV3; // 组件接收的 VIADefinition 数据
  onLayoutChange: (newSelectedOptionKeys: number[]) => void; // 布局变化时调用的回调函数
  RowComponent?: React.JSXElementConstructor<any>; // 可选的自定义行组件
}

// Layouts 组件
function Layouts({
  definition,
  onLayoutChange,
  RowComponent = IndentedControlRow, // 默认行组件为 IndentedControlRow
}: Props): JSX.Element | null {
  const selectedOptionKeys = useAppSelector(getDesignSelectedOptionKeys); // 从 Redux store 中获取选中的选项键
  const dispatch = useDispatch(); // 获取 dispatch 函数

  // 当 definition 变化时，清空选中的选项键
  React.useEffect(() => {
    dispatch(updateSelectedOptionKeys([]));
  }, [definition]);

  // 当 selectedOptionKeys 变化时，调用 onLayoutChange 回调函数
  React.useEffect(() => {
    onLayoutChange(selectedOptionKeys);
  }, [selectedOptionKeys]);

  // 如果 definition 中没有布局标签，返回 null
  if (!definition.layouts.labels) {
    return null;
  }

  // 渲染布局控制项
  const LayoutControls = definition.layouts.labels.map((label, layoutKey) => {
    const optionKeys = definition.layouts.optionKeys[layoutKey];
    const { t } = useTranslation(); // 获取翻译函数

    // 处理多版本布局
    if (Array.isArray(label)) {
      const name = label[0]; // 标签名称
      const options = label.slice(1); // 标签选项

      // 创建下拉选项列表
      const selectElementOptions = options.map((option, optionIndex) => ({
        label: option,
        value: optionKeys[optionIndex],
      }));

      return (
        <RowComponent key={`${layoutKey}-${name}`}>
          <Label>{t(name)}</Label>
          <Detail>
            <AccentSelect
              onChange={(option: any) => {
                if (option && option.label) {
                  const optionIndex = options.indexOf(option.label); // 获取选项索引
                  const optionKeys = Array.from(selectedOptionKeys).map(
                    (i) => i || 0,
                  );
                  optionKeys[layoutKey] = optionIndex; // 更新选中的选项键
                  dispatch(updateSelectedOptionKeys(optionKeys)); // 更新 Redux store
                }
              }}
              value={
                selectedOptionKeys[layoutKey]
                  ? selectElementOptions[selectedOptionKeys[layoutKey]]
                  : (selectElementOptions[0] as any) // 设置默认值
              }
              options={selectElementOptions as any}
            />
          </Detail>
        </RowComponent>
      );
    }

    // 处理字符串标签
    if (typeof label === 'string') {
      return (
        <RowComponent key={`${layoutKey}-${label}`}>
          <Label>{t(label)}</Label>
          <Detail>
            <AccentSlider
              isChecked={Boolean(selectedOptionKeys[layoutKey])} // 设置滑块是否选中
              onChange={(isChecked) => {
                const optionKeys = Array.from(selectedOptionKeys).map(
                  (i) => i || 0,
                );
                optionKeys[layoutKey] = Number(isChecked); // 更新选中的选项键
                dispatch(updateSelectedOptionKeys(optionKeys)); // 更新 Redux store
              }}
            />
          </Detail>
        </RowComponent>
      );
    }

    return null;
  });

  return <>{LayoutControls}</>; // 返回布局控制项
}

export default Layouts; // 导出 Layouts 组件
