import { useEffect } from 'react';
import { getTestKeyboardSoundsSettings } from 'src/store/settingsSlice';
import { TestKeyState } from 'src/types/types';
import { Note, setGlobalAmpGain } from '../../utils/note';
import { useAppSelector } from 'src/store/hooks';

// 测试键盘声音模式的枚举
export enum TestKeyboardSoundsMode {
  Random,       // 随机模式
  WickiHayden,  // Wicki-Hayden模式
  Chromatic,    // 全音阶模式
}

// 记录上次按键状态的变量
let lastPressedKeys: TestKeyState[][] = [];
// 记录当前音符的对象
let notes: Record<string, Note> = {};

// 基础种子，用于生成伪随机数
const baseSeed = Math.floor(Math.random() * 1000);

// 伪随机数生成器函数
const seededRandom = (seed: number) => {
  return (((baseSeed + seed) * 9301 + 49297) % 233280) / 233280;
};

// 计算MIDI音符的函数
const calculateMidiNote = (
  mode: TestKeyboardSoundsMode,
  transpose: number,
  rowCount: number,
  row: number,
  col: number,
) => {
  // 调整行数以适应不同的键盘布局
  // 将行映射到0..4 = 从底部行到顶部行
  // 例如，2行的宏垫与60%键盘的前两行相同
  const adjustedRow =
    Math.min(4, rowCount - row - 1) + Math.max(0, 5 - rowCount);

  switch (mode) {
    case TestKeyboardSoundsMode.WickiHayden: {
      // 对于Wicki-Hayden模式的音符计算
      // 底行相对
      // J键是C4 = 72
      // Home row的起始音符是72 - 14
      const rowStartMidiNote = [-18, -19, -14, -9, -4];
      return rowStartMidiNote[adjustedRow] + 72 + transpose + col * 2;
    }
    case TestKeyboardSoundsMode.Chromatic: {
      // 对于全音阶模式的音符计算
      // 底行相对
      // J键是C4 = 72
      // Home row的起始音符是72 - 7
      const rowStartMidiNote = [-15, -12, -7, -1, +4];
      return rowStartMidiNote[adjustedRow] + 72 + transpose + col;
    }
    case TestKeyboardSoundsMode.Random:
    default: {
      // 对于随机模式的音符计算
      return (
        72 + transpose + Math.floor(seededRandom(row * 1000 + col) * 24) - 12
      );
    }
  }
};

// 关闭所有音符的函数
const turnOffAllTheNotes = () => {
  Object.values(notes).forEach((note) => note?.noteOff());
};

// TestKeyboardSounds组件
export const TestKeyboardSounds: React.FC<{
  pressedKeys: TestKeyState[][]; // 当前按键状态
}> = ({ pressedKeys }) => {
  // 从Redux状态中获取测试键盘声音设置
  const { waveform, volume, mode, transpose } = useAppSelector(
    getTestKeyboardSoundsSettings,
  );

  // 更新全局音量增益
  useEffect(() => {
    setGlobalAmpGain(volume / 100);
  }, [volume]);

  // 处理按键状态的变化
  useEffect(() => {
    if (pressedKeys.length === 0) {
      turnOffAllTheNotes(); // 如果没有按键被按下，则关闭所有音符
    } else {
      const rowCount = pressedKeys.length;
      lastPressedKeys = pressedKeys.reduce((p, n, row) => {
        return [
          ...p,
          n.reduce((p2, n2, col) => {
            const index = `${row},${col}`;
            const lastState =
              lastPressedKeys?.at(row)?.at(col) ?? TestKeyState.KeyUp;
            const state = n2 ?? TestKeyState.KeyUp;
            if (state != lastState) {
              if (state == TestKeyState.KeyDown) {
                const midiNote = calculateMidiNote(
                  mode,
                  transpose,
                  rowCount,     
                  row,
                  col,
                );
                notes[index] = new Note(midiNote, waveform);
                notes[index].noteOn(); // 播放音符
              } else if (state == TestKeyState.KeyUp) {
                notes[index]?.noteOff(); // 停止播放音符
              }
            }
            return [...p2, n2];
          }, [] as TestKeyState[]),
        ];
      }, [] as TestKeyState[][]);
    }
  }, [pressedKeys]);

  // 清理：组件卸载时关闭所有音符
  useEffect(() => {
    return () => {
      turnOffAllTheNotes();
    };
  }, []);

  return null; // 不渲染任何内容
};
