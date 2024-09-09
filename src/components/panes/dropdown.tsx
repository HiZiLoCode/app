import styled from 'styled-components';

export const DropDownContainer = styled.div<{width:string}>`
  display: flex;
  align-items: center;
  position: relative;
  width: ${({ width }) => width};
  margin: auto;
  @media (max-width: 750px) {
    margin-right: 0;
  }
  .dropdown-button-content {
    display: flex;
    align-items: center;
    font-size: 16px;

    .dropdown-arrow {
      font-size: 18px;
      margin-left: 4px;
      transform: rotate(90deg);
      color: var(--color_inside-accent);

    }
  }
  &:hover {
    .dropdown-arrow {
      transform: rotate(270deg);
    }
  }
`;
export const DropDown = styled.div<{position:string,selected?: boolean}>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 130px;
  color:  var(--cd-primary-color);
  background: ${({selected}) =>( selected ? 'var(--color_inside-accent)' : 'var(--color_accent)')};   
  border-radius: 5px;
  box-shadow: 0 2px 4px 0 rgb(0 0 0 / 50%);
  z-index: 1000;
  position: absolute;
  top: 45px;
  left: ${({ position }) => (position === "left" ? 0 : "auto")};
  right: ${({ position }) => (position === "right" ? 0 : "auto")};
  .dropdown-item {
    display: flex;
    align-items: center;
    width: 88%;
    height: 24px;
    margin: 3px 3% 4px;
    padding: 0 3%;
    font-size: 14px;
    white-space: nowrap;
    border-radius: 3px;
    cursor: pointer;
    &:hover {
      background: ${({selected}) =>selected ? 'var(--color_accent)' : 'transparent'};
      color: var(--color_inside-accent);
    }
  }
  .pointerStyles {
       border-style:solid;
       border-color: transparent;
       border-left: 6px solid transparent;
       border-right: 6px solid transparent;
       border-top: 6px solid var(--color_accent);
       position: absolute;
      margin-left: -6;
      width: 0;
      width: 0;
    transform: rotate(180deg);
    right: 20px;
    top: -9px;
  }
  .dropdown-separate {
    width: 88%;
    height: 0.5px;
    border: solid 0.5px ${({selected}) =>selected ? 'var(--color_accent)' : 'transparent'};;
    margin: 0 6%;
  }

`;