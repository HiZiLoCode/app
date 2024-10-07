import React,{useState,useEffect} from 'react';
import Select, {Props as SelectProps} from 'react-select';
import { useTranslation } from 'react-i18next';

const customStyles = {
  option: (provided: any, state: any) => {
    return {
      ...provided,
      '&:hover': {
        backgroundColor: state.isSelected
          ? 'var(--color_accent)'
          : 'var(--bg_control)',
      },
      ':active': {
        backgroundColor: 'var(--bg_control)',
      },
      background: state.isSelected
        ? 'var(--color_accent)'
        : state.isFocused
        ? 'var(--bg_control)'
        : 'var(--bg_menu)',
      color: state.isSelected
        ? 'var(--color_inside-accent)'
        : state.isFocused
        ? 'var(--color_accent)'
        : 'var(--color_accent)',
    };
  },
  container: (provided: any) => ({
    ...provided,
    lineHeight: 'initial',
    flex: 1,
  }),
  input: (provided: any) => ({
    ...provided,
    color: 'var(--color_accent)',
    opacity: 0.5,
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: 'var(--color_accent)',
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    color: 'var(--color_accent)',
  }),
  indicatorSeparator: (provided: any) => ({
    ...provided,
    backgroundColor: 'var(--color_accent)',
  }),
  menuList: (provided: any) => ({
    ...provided,
    borderColor: 'var(--color_accent)',
    backgroundColor: 'var(--bg_menu)',
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: 'var(--color_accent)',
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    ':active': {
      backgroundColor: 'var(--bg_control)',
      borderColor: 'var(--color_accent)',
    },
    '&:hover': {
      borderColor: 'var(--color_accent)',
    },
    color: 'var(--color_accent)',
    background: 'var(--bg_menu)',
  }),
  control: (provided: any, state: any) => {
    const res = {
      ...provided,
      boxShadow: 'none',
      ':active': {
        backgroundColor: 'transparent',
        borderColor: 'var(--color_accent)',
      },
      '&:hover': {
        borderColor: 'var(--color_accent)',
      },
      color: 'var(--color_accent)',
      borderColor: '1px solid var(--color_accent)',
      background: 'var(--bg_menu)',
      overflow: 'hidden',
      width: state.selectProps.width || 250,
    };
    return res;
  },
};
// 选项类型定义
interface OptionType {
  value?: string;
  label?: string;
}
// 组件的 Props 类型定义
interface AccentSelectProps extends SelectProps<OptionType, false> {
  // 可以添加其他自定义的 props
  option?:OptionType[]
  defaultValue?:any,
  value?:OptionType,
}
// 修改组件 更换语言时及时更新
export const AccentSelect: React.FC<any> = (props) =>{
  
  const {t,i18n} = useTranslation()
    // 翻译选项中的 label
    const [translatedOptions, setTranslatedOptions] = useState<OptionType[]>([]);
    const [selectedValue, setSelectedValue] = useState<OptionType[]>([]);
    useEffect(() => { 
      console.log(i18n.language);console.log(props);
      

      const updatedOptions:OptionType[]|any  = props.options?.map((option:any) => ({
        ...option,
        label: t(option.label),
      }));
      setTranslatedOptions(updatedOptions)   
      if (props?.defaultValue) {
        const selected = updatedOptions.filter((option:any) => props.defaultValue?.value=== option.value);
        setSelectedValue(selected);
      }else if(props?.value){
        const selected = updatedOptions.filter((option:any) => props.value?.value=== option.value);
        setSelectedValue(selected);
      }
    }, [props?.defaultValue,props?.value,i18n.language]);
 
  
  return  (
    <Select {...props} styles={customStyles} options={translatedOptions} value={selectedValue}/>
  );
}
