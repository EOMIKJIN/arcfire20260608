export type TypewriterResetInput = {
  text: string;
  active: boolean;
  skipAnimation: boolean;
};

export type TypewriterResetState = {
  displayed: string;
  done: boolean;
  index: number;
};

/** 페이지 전환 시 빈 문자열로 지우지 않는다. 첫 글자부터 커밋해 한 프레임 점멸을 막는다. */
export function resolveTypewriterResetState(input: TypewriterResetInput): TypewriterResetState {
  const { text, active, skipAnimation } = input;
  if (!active) {
    return { displayed: '', done: false, index: 0 };
  }
  if (skipAnimation) {
    return { displayed: text, done: true, index: text.length };
  }
  if (text.length === 0) {
    return { displayed: '', done: true, index: 0 };
  }
  return { displayed: text.slice(0, 1), done: text.length <= 1, index: 1 };
}

export function typewriterEpoch(input: {
  resetToken?: string;
  text: string;
  active: boolean;
  skipAnimation: boolean;
}): string {
  return `${input.resetToken ?? ''}\0${input.text}\0${input.active ? '1' : '0'}\0${input.skipAnimation ? '1' : '0'}`;
}
