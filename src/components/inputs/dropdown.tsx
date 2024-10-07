
import  i18n from 'i18next';
import { useState } from 'react'
import classNames from "classnames";
import { DropDownContainer,DropDown} from '../panes/dropdown';
import { Button } from 'src/components/inputs/button';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { faAngleDown, faLanguage } from '@fortawesome/free-solid-svg-icons';
interface Item{
    label:string,
    value:string
}

const CatgoryButton:any = styled(Button)<{disabled: boolean}>`
  width: auto;
  line-height: 18px;
  border-radius: 64px;
  font-size: 14px;
  border: none;
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
const DropDownLanguage=styled.span`
    margin-left: 5px;
    
`
const CategoryLanguage=styled.div`
color: var(--color_inside-accent);
    
`
// 组件的属性类型
type Options = {
  // 下拉选项的文本
  name: string
  // 下拉选项自定义类名
  value: string
}
// 组件的属性类型
type Props = {
  data: Options[]
  position?: string
  width?: string
  name?: any
  className?: string
  resources:any
};

export const MyDropDown= ({
  data,
  position,
  resources,
  width,
  name,
}: Props) => {
  // 是否显示下拉选项
  const [showDropDown, setShowDropDown] = useState(false)
  // 下拉选项位置
  const dropdownPosition: string = position ?? 'left'
  // 下拉框宽度，默认100%
  const dropdownWidth: string = width ?? '100%'
  // 下拉选项点击事件
  const [languageName,setLanguage]=useState(i18n.language)
  const handlerItemClick = (value:string) => {
    i18n.changeLanguage(value)
    setLanguage(value)
    setShowDropDown(false)
  }
  const {t} =useTranslation()
  return (
    <>
      <DropDownContainer  width={dropdownWidth} onMouseLeave={() => {
            setShowDropDown(false)
          }}>
        <CatgoryButton
          className="dropdown-button"
          onMouseOver={() => {
            setShowDropDown(true)
          }}
        >
          <div className={classNames('dropdown-button-content')}>
            <div
              className={classNames('dropdown-button-title')}
              style={{
                textTransform: 'uppercase',
              }}
            >
              {name?? 
               (
                <CategoryLanguage>
                    <FontAwesomeIcon size={"2xl"} icon={faLanguage} />
                    <DropDownLanguage>{t(resources[languageName])}</DropDownLanguage>
                </CategoryLanguage>
             
               )
              }
            </div>
            <FontAwesomeIcon
              icon={faAngleDown}
              style={{
                transform: showDropDown ? 'rotate(180deg)' : '',
                transition: 'transform 0.2s ease-out',
                marginLeft: '5px',
              }}
            />
          </div>
        </CatgoryButton>
        {showDropDown && (
          <DropDown position={dropdownPosition} onMouseLeave={ () => {
            setShowDropDown(false)
          }}>
            <>
              {data.map((item, index) => (
                <>
                  <Button key={index} className={classNames('dropdown-item')} onClick={()=>{
                    handlerItemClick(item.value)
                  }}>
                    {item.name}
                  </Button>
                  {index !== data.length - 1 && <div className={classNames('dropdown-separate')}></div>}
                </>
              ))}
              <div  className='pointerStyles'></div>
            </>
          </DropDown>
        )}
      </DropDownContainer>
    </>
  )
}