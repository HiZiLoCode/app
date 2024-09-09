import {faDiscord, faGithub} from '@fortawesome/free-brands-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import {RDRLogo} from '../icons/via';
import {CategoryMenuTooltip} from '../inputs/tooltip';
import {CategoryIconContainer} from '../panes/grid';
import  i18n from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resources } from 'src/utils/react-i18n-config';
import { MyDropDown } from '../inputs/dropdown';
const ExternalLinkContainer = styled.span`
  position: absolute;
  right: 1em;
  display: flex;
  gap: 1em;
`;
const DivPointer =styled.div`
  cursor: pointer;
`
function changeLanguage(event:any){
  
  event.preventDefault(); // 阻止默认行为
  event.stopPropagation(); // 阻止事件冒泡
  if (i18n.language === 'en') {
    i18n.changeLanguage('zh');
  } else {
    i18n.changeLanguage('en');
  }
} 
interface translation{
  zh:string|any
  en:string
}
const translationList:translation={
      en:"EngLish",
      zh:"简体中文"
}
type Options = {
  // 下拉选项的文本
  name: string
  // 下拉选项自定义类名
  value: string
}
const DropdownList=Object.keys(resources).map((item:string):object=>{
  return {name:translationList[item]||item,value:item}
})
export const ExternalLinks = () => {
  const {t} =useTranslation()
  const [poprverState,setPoprverState] = useState(DropdownList as Options[])
  return (
  
    <ExternalLinkContainer>
      <MyDropDown 
      data={poprverState}
      resources={translationList}
       position="right"
      />
      <a href="https://caniusevia.com/" target="_blank">
        <CategoryIconContainer>
          <RDRLogo height="25px" fill="currentColor" />
          <CategoryMenuTooltip>{t("Firmware + Docs")}</CategoryMenuTooltip>
        </CategoryIconContainer>
      </a>
      <a href="https://discord.gg/NStTR5YaPB" target="_blank">
        <CategoryIconContainer>
          <FontAwesomeIcon size={'xl'} icon={faDiscord} />
          <CategoryMenuTooltip>{t("Shopping")}</CategoryMenuTooltip>
        </CategoryIconContainer>
      </a>
      {/* <a href="https://github.com/the-via/app" target="_blank">
        <CategoryIconContainer>
          <FontAwesomeIcon size={'xl'} icon={faGithub} />
          <CategoryMenuTooltip>Github</CategoryMenuTooltip> 
        </CategoryIconContainer>
      </a> */}
    </ExternalLinkContainer>
  )
};
