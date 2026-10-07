// node 헤드리스 감사용 — 게임 모듈의 이미지 require를 숫자 id로 바꾼다.
for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
  require.extensions[ext] = (module) => {
    module.exports = 0;
  };
}
