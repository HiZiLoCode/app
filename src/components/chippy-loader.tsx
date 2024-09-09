import styled from 'styled-components';
import imgSrc from 'assets/images/chippy_600.png';
import {Theme} from 'src/utils/themes';
import {getDarkenedColor} from 'src/utils/color-math';
import {getSelectedTheme} from 'src/store/settingsSlice';
import {useAppSelector} from 'src/store/hooks';

const defaultChippy = {
  width: 300,
  height: 300,
  src: imgSrc,
};

const LoaderContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CircleContainer = styled.div<{
  $containerHeight: number;
  $containerWidth: number;
  $progress: number | null;
  $progressColor: string;
}>`
  border-radius: 50%;
  background-color: var(--bg_icon);
  height: ${(props) => props.$containerHeight}px;
  width: ${(props) => props.$containerWidth}px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;

  animation-duration: 1.5s;
  animation-name: roll;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-timing-function: ease-in-out;

  &::after {
    height: ${(props) => props.$containerHeight}px;
    width: ${(props) => props.$containerWidth}px;
    position: absolute;
    content: '';
    background-color: ${(p) => p.$progressColor};
    top: ${(props) => props.$containerHeight + 1}px;
    left: 0;
    right: 0;
    transition: transform 0.4s ease-out;
    transform: translate3d(
      0,
      ${(props) => -(props.$progress || 0) * props.$containerHeight}px,
      0
    );
  }
`;

type Props = {
  progress: number | null;
  width?: number;
  height?: number;
  theme: Theme;
};

const SvgComponent: React.FC<any & {theme: Theme}> = (props) => {
  const {theme} = props;

  const darkAccent = getDarkenedColor(theme.accent.c, 0.8);
  const colorMap = {
    'upper-body': theme.mod.t,
    'lower-body': theme.mod.c,
    accent: darkAccent,
    bowtie: darkAccent,
    pins: darkAccent,
    feet: '#000',
  };
  return (
    <svg
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      x={0}
      y={0}
      viewBox="0 0 600 600"
      style={{
        enableBackground: 'new 0 0 600 600',
      }}
      xmlSpace="preserve"
      {...props}
    >
      <style>
        {`.st3{fill:#fdfefe}.st4{fill:${colorMap.bowtie}}.st5{fill-rule:evenodd;clip-rule:evenodd;fill:${colorMap.accent}}.st7,.st9{fill-rule:evenodd;clip-rule:evenodd}.st10,.st9{fill:#fff}`}
      </style>
      <g id="Layer_2_00000088814685506851870240000015950599998114990989_">
        <g  id="Feet" transform="translate(00.000000,605.000000) scale(0.830000,-0.830000)"><path style={{
              fill: colorMap['upper-body'],
            }} xmlns="http://www.w3.org/2000/svg" d="M207 671 c-101 -52 -166 -134 -193 -244 -29 -117 5 -235 93 -323 38 -37 127 -94 148 -94 3 0 5 26 5 58 0 56 -2 60 -40 91 -93 74 -121 217 -64 322 16 29 46 65 66 82 35 28 38 35 38 79 0 26 -4 48 -8 48 -4 0 -25 -9 -45 -19z"></path></g>
        <g id='Body' transform="translate(130.000000,591.000000) scale(0.800000,-0.800000)" stroke="none">
        <path xmlns="http://www.w3.org/2000/svg" 
          d="M168 703 l-28-4 0-351 0-350 88 4c63 3 100 11 135 27 26 13 47 27 47 31 0 4-8 18-18 30-17 21-21 21-80 10-34-6-67-8-72-5-6 4-10 77-10 181 0 148-2 174-15 174-10 0-15 11-15 35-4 16 7 22 22 22 11 0 15 12 15 51l0 52 48-5c93-9 167-64 210-157 21-45 24-64 19-117-2-36-14-81-26-104-11-22-17-40-13-40 4 0 15-12 24-27l16-27 27 53c49 98 45 225-12 327-66 118-225 197-351 191z"/>
        
        <path style={{
              fill: colorMap['upper-body'],
            }} xmlns="http://www.w3.org/2000/svg" d="M205 515 c-7 -2 -13 -18 -13 -34 0 -29 1 -29 55 -29 60 0 95 -22 95 -59 0 -30 -48 -81 -76 -81 -13 0 -24 -2 -24 -5 0 -3 48 -66 106 -140 l106 -135 50 0 c59 0 62 -9 -54 132 -48 59 -88 109 -88 112 0 2 16 20 35 39 30 30 35 42 35 80 0 80 -61 128 -162 126 -29 0 -59 -3 -65 -6z" />
        </g>
        {/* <g id="Feet">

          <path  xmlns="http://www.w3.org/2000/svg" 
           d="M207 671 c-101 -52 -166 -134 -193 -244 -29 -117 5 -235 93 -323 38 -37 127 -94 148 -94 3 0 5 26 5 58 0 56 -2 60 -40 91 -93 74 -121 217 -64 322 16 29 46 65 66 82 35 28 38 35 38 79 0 26 -4 48 -8 48 -4 0 -25 -9 -45 -19z"/>
        </g> */}
        
        {/* <g id="Body">
          <path
            d="M26.7 66.8h546.2c9.8 0 17.7 7.9 17.7 17.7v273.3H9V84.6c0-9.8 7.9-17.8 17.7-17.8z"
            style={{
              fill: colorMap['upper-body'],
            }}
          />
          <path
            d="M9 357.4h581.6v113.7c0 8.4-6.9 15.3-15.3 15.3h-551c-8.4 0-15.3-6.9-15.3-15.3V357.4z"
            style={{
              fill: colorMap['lower-body'],
            }}
          />
        </g>
        <path
          d="M229.4 262.8s33.5 19.4 66.3 19.4c33.5 0 66.3-19.4 66.3-19.4"
          style={{
            fill: 'none',
            stroke: '#000',
            strokeWidth: 6.8265,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeMiterlimit: 2.0408,
          }}
          id="Smile"
        />
        <g id="Eyes">
          <path d="M417.1 132.4c26.5 0 48 26.4 48 59.1s-21.4 59.1-48 59.1-48-26.4-48-59.1 21.5-59.1 48-59.1zM175.3 132.4c26.5 0 48 26.4 48 59.1s-21.4 59.1-48 59.1-48-26.4-48-59.1 21.5-59.1 48-59.1z" />
          <path
            className="st3"
            d="M422.7 210.7c4.2 0 7.7 3.5 7.7 7.7s-3.5 7.7-7.7 7.7-7.7-3.5-7.7-7.7 3.5-7.7 7.7-7.7zM418.2 159.7c9.5 0 17.3 7.8 17.3 17.3s-7.8 17.3-17.3 17.3-17.3-7.8-17.3-17.3c-.1-9.5 7.7-17.3 17.3-17.3zM179.9 210.7c4.2 0 7.7 3.5 7.7 7.7s-3.5 7.7-7.7 7.7-7.7-3.5-7.7-7.7 3.5-7.7 7.7-7.7zM175.3 159.7c9.5 0 17.3 7.8 17.3 17.3s-7.8 17.3-17.3 17.3S158 186.5 158 177c-.1-9.5 7.8-17.3 17.3-17.3z"
          />
        </g>
        <g id="Pins">
          <path
            className="st4"
            d="M12.6 276h17.5c5.8 0 10.5 6.9 10.5 15.3V324c0 8.4-4.7 15.3-10.5 15.3H12.6C6.7 339.3 2 332.4 2 324v-32.7c0-8.4 4.7-15.3 10.6-15.3zM12.6 190.3h17.5c5.8 0 10.5 6.9 10.5 15.3v32.7c0 8.4-4.7 15.3-10.5 15.3H12.6c-5.8 0-10.5-6.9-10.5-15.3v-32.7c-.1-8.4 4.6-15.3 10.5-15.3zM12.6 102.6h17.5c5.8 0 10.5 6.9 10.5 15.3v32.7c0 8.4-4.7 15.3-10.5 15.3H12.6C6.7 165.8 2 159 2 150.5v-32.7c0-8.4 4.7-15.2 10.6-15.2zM569.6 276h17.5c5.8 0 10.5 6.9 10.5 15.3V324c0 8.4-4.7 15.3-10.5 15.3h-17.5c-5.8 0-10.5-6.9-10.5-15.3v-32.7c0-8.4 4.7-15.3 10.5-15.3zM569.6 190.3h17.5c5.8 0 10.5 6.9 10.5 15.3v32.7c0 8.4-4.7 15.3-10.5 15.3h-17.5c-5.8 0-10.5-6.9-10.5-15.3v-32.7c0-8.4 4.7-15.3 10.5-15.3zM569.6 102.6h17.5c5.8 0 10.5 6.9 10.5 15.3v32.7c0 8.4-4.7 15.3-10.5 15.3h-17.5c-5.8 0-10.5-6.9-10.5-15.3v-32.7c0-8.5 4.7-15.3 10.5-15.3z"
          />
        </g>
        <g id="Cheeks">
          <g id="Layer_8">
            <ellipse
              transform="rotate(120 89.724 277.697)"
              className="st5"
              cx={68.5}
              cy={243.9}
              rx={12.9}
              ry={29.3}
            />
            <ellipse
              transform="rotate(150 447.814 278.705)"
              className="st5"
              cx={430.5}
              cy={271.6}
              rx={29.3}
              ry={12.9}
            />
          </g>
        </g>
        <g id="Bowties">
          <path
            className="st4"
            d="m293.7 356.6 73.5-33.7v67.3l-73.5-33.6zM293.7 356.6l-73.5 33.7V323l73.5 33.6z"
          />
        </g> */}
      </g>
      {/* <g
        id="Layer2"
        style={{
          opacity: 0.15,
        }}
      >
        <path
          className="st7"
          d="M6.7 105.2c2.5-2.6 5.8-2.5 5.8-2.5v63.2s-3.9.4-7.1-4c-.7-.7-3.4-5.1-3.4-11.3v-32.4c0-7 2.7-11 4.7-13z"
        />
        <path
          d="M112.4 486.3H24c-13 0-14.8-14.5-14.8-14.5S9 332.7 9 353.4c0 20.8 79.5 132.9 103.4 132.9z"
          style={{
            fillRule: 'evenodd',
            clipRule: 'evenodd',
            fill: '#180000',
          }}
        />
        <path
          className="st9"
          d="M35.9 105.1c-2.5-2.6-5.8-2.5-5.8-2.5v63.2s3.9.4 7.1-4c.7-.7 3.4-5.1 3.4-11.3v-32.4c0-7-2.8-11-4.7-13z"
        />
        <path
          className="st7"
          d="M6.7 192.9c2.5-2.6 5.8-2.5 5.8-2.5v63.2s-3.9.4-7.1-4c-.7-.7-3.4-5.1-3.4-11.3v-32.4c0-7 2.7-11 4.7-13z"
        />
        <path
          className="st9"
          d="M35.9 192.8c-2.5-2.6-5.8-2.5-5.8-2.5v63.2s3.9.4 7.1-4c.7-.7 3.4-5.1 3.4-11.3v-32.4c0-7-2.8-11-4.7-13z"
        />
        <path
          className="st7"
          d="M6.7 278.6c2.5-2.6 5.8-2.5 5.8-2.5v63.2s-3.9.4-7.1-4c-.7-.7-3.4-5.1-3.4-11.3v-32.4c0-6.9 2.7-10.9 4.7-13z"
        />
        <path
          className="st9"
          d="M35.9 278.5c-2.5-2.6-5.8-2.5-5.8-2.5v63.2s3.9.4 7.1-4c.7-.7 3.4-5.1 3.4-11.3v-32.4c0-7-2.8-11-4.7-13z"
        />
        <path
          className="st7"
          d="M563.7 105.2c2.5-2.6 5.8-2.5 5.8-2.5v63.2s-3.9.4-7.1-4c-.7-.7-3.4-5.1-3.4-11.3v-32.4c0-7 2.7-11 4.7-13z"
        />
        <path
          className="st9"
          d="M592.9 105.1c-2.5-2.6-5.8-2.5-5.8-2.5v63.2s3.9.4 7.1-4c.7-.7 3.4-5.1 3.4-11.3v-32.4c0-7-2.7-11-4.7-13z"
        />
        <path
          className="st7"
          d="M563.7 192.9c2.5-2.6 5.8-2.5 5.8-2.5v63.2s-3.9.4-7.1-4c-.7-.7-3.4-5.1-3.4-11.3v-32.4c0-7 2.7-11 4.7-13z"
        />
        <path
          className="st9"
          d="M592.9 192.8c-2.5-2.6-5.8-2.5-5.8-2.5v63.2s3.9.4 7.1-4c.7-.7 3.4-5.1 3.4-11.3v-32.4c0-7-2.7-11-4.7-13z"
        />
        <path
          className="st7"
          d="M563.7 278.6c2.5-2.6 5.8-2.5 5.8-2.5v63.2s-3.9.4-7.1-4c-.7-.7-3.4-5.1-3.4-11.3v-32.4c0-6.9 2.7-10.9 4.7-13z"
        />
        <path
          className="st9"
          d="M592.9 278.5c-2.5-2.6-5.8-2.5-5.8-2.5v63.2s3.9.4 7.1-4c.7-.7 3.4-5.1 3.4-11.3v-32.4c0-7-2.7-11-4.7-13z"
        />
        <path
          className="st10"
          d="M220.2 323.1v34.2l73.4-.6zM293.7 356.6l73.5-33.6v34.3"
        />
      </g> */}
    </svg>
  );
};

export default function ChippyLoader(props: Props) {
  const width = props.width || defaultChippy.width;
  const height = props.width || defaultChippy.height;
  const containerPadding = width * 0.25;
  const [containerHeight, containerWidth] = [
    height + containerPadding * 2,
    width + containerPadding * 2,
  ];
  const selectedTheme = useAppSelector(getSelectedTheme);

  return (
    <LoaderContainer>
      <CircleContainer
        $progress={props.progress}
        $progressColor={getDarkenedColor(selectedTheme.accent.c, 0.9)}
        $containerHeight={containerHeight}
        $containerWidth={containerWidth}
      >
        <div
          style={{
            zIndex: 1,
            width: width,
          }}
        >
          <SvgComponent theme={props.theme} />
        </div>
      </CircleContainer>
    </LoaderContainer>
  );
}
