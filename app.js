(() => {
  'use strict';
  const actions = {
    idle: { row: 0, count: 6, interval: 420, title: '发会儿呆', en: 'IDLE', caption: '不着急，陪你慢慢来。' },
    right: { row: 1, count: 8, interval: 180, title: '向右走走', en: 'WALK RIGHT', caption: '一起往前走一小步。' },
    left: { row: 2, count: 8, interval: 180, title: '向左走走', en: 'WALK LEFT', caption: '换个方向，也没关系。' },
    waving: { row: 3, count: 4, interval: 260, title: '打个招呼', en: 'WAVING', caption: '嗨，很高兴又见到你。' },
    jumping: { row: 4, count: 5, interval: 210, title: '向上跳跳', en: 'JUMPING', caption: '给今天一点点活力。' },
    failed: { row: 5, count: 8, interval: 360, title: '叹一口气', en: 'FAILED', caption: '没关系，休息一下再来。' },
    waiting: { row: 6, count: 6, interval: 420, title: '等你一下', en: 'WAITING', caption: '慢慢想，我就在这里。' },
    running: { row: 7, count: 6, interval: 280, title: '认真打字', en: 'WORKING', caption: '专注的时候，也有我陪着。' },
    review: { row: 8, count: 6, interval: 300, title: '给你点赞', en: 'REVIEW', caption: '这一刻，值得一个赞。' }
  };
  const sprite = document.getElementById('sprite');
  const image = new Image();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 'idle', frame = 0, paused = reduced.matches, ready = false, previous = 0;
  const buttons = [...document.querySelectorAll('[data-action]')];
  const playButton = document.getElementById('play-toggle');
  const stepButton = document.getElementById('step-frame');
  const mobileAction = document.getElementById('mobile-action');

  function render() {
    const width = sprite.clientWidth;
    const height = sprite.clientHeight;
    sprite.style.backgroundSize = `${width * 8}px ${height * 11}px`;
    sprite.style.backgroundPosition = `${-frame * width}px ${-actions[selected].row * height}px`;
    document.getElementById('frame-label').textContent = `${String(frame + 1).padStart(2, '0')} / ${String(actions[selected].count).padStart(2, '0')}`;
  }
  function updatePlayback() {
    playButton.setAttribute('aria-pressed', String(paused));
    document.getElementById('play-label').textContent = paused ? '播放动画' : '暂停动画';
    document.getElementById('pause-icon').hidden = paused;
    document.getElementById('play-icon').hidden = !paused;
    document.getElementById('play-note').textContent = reduced.matches && paused ? '已遵循系统减少动态效果设置；也可以手动播放。' : paused ? '动画已暂停，可以逐帧看看 L。' : '动作循环播放，随时可以停下来。';
  }
  function selectAction(id) {
    if (!Object.hasOwn(actions, id)) throw new Error('请选择有效的 L 动作。');
    selected = id;
    frame = 0;
    previous = performance.now();
    buttons.forEach(button => {
      const active = button.dataset.action === id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('state-title').textContent = actions[id].title;
    mobileAction.value = id;
    document.getElementById('state-en').textContent = actions[id].en;
    document.getElementById('state-caption').textContent = actions[id].caption;
    sprite.setAttribute('aria-label', `L 正在${actions[id].title}`);
    render();
    return { action: id, title: actions[id].title, frame: frame + 1, paused };
  }
  function setPaused(value) {
    paused = value;
    previous = performance.now();
    updatePlayback();
  }
  buttons.forEach(button => button.addEventListener('click', () => selectAction(button.dataset.action)));
  mobileAction.addEventListener('change', () => selectAction(mobileAction.value));
  playButton.addEventListener('click', () => setPaused(!paused));
  stepButton.addEventListener('click', () => { setPaused(true); frame = (frame + 1) % actions[selected].count; render(); });
  image.addEventListener('load', () => {
    if (image.naturalWidth !== 1536 || image.naturalHeight !== 2288) return failImage();
    ready = true;
    sprite.style.backgroundImage = 'url("l-sprites.webp")';
    document.getElementById('fallback-image').hidden = true;
    buttons.forEach(button => button.disabled = false);
    playButton.disabled = false;
    stepButton.disabled = false;
    mobileAction.disabled = false;
    render();
  });
  function failImage() {
    ready = false;
    setPaused(true);
    buttons.forEach(button => button.disabled = true);
    playButton.disabled = true;
    stepButton.disabled = true;
    mobileAction.disabled = true;
    document.getElementById('asset-error').hidden = false;
  }
  image.addEventListener('error', failImage);
  image.src = 'l-sprites.webp';
  buttons.forEach(button => button.disabled = true);
  playButton.disabled = true;
  stepButton.disabled = true;
  mobileAction.disabled = true;
  updatePlayback();
  new ResizeObserver(render).observe(sprite);
  reduced.addEventListener('change', () => { setPaused(reduced.matches); render(); });
  document.addEventListener('visibilitychange', () => { previous = performance.now(); });
  function tick(time) {
    if (ready && !paused && !document.hidden && time - previous >= actions[selected].interval) {
      frame = (frame + 1) % actions[selected].count;
      previous = time;
      render();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Optional structured access uses exactly the same state as the visible controls.
  const context = document.modelContext;
  if (context?.registerTool) {
    const lifecycle = new AbortController();
    const register = tool => {
      try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {}
    };
    register({
      name: 'set_l_animation', title: '切换 L 的动作',
      description: '在网页试玩区切换 L 的动画，不会控制桌面宠物。',
      inputSchema: { type: 'object', properties: { action: { type: 'string', enum: Object.keys(actions) } }, required: ['action'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).length !== 1 || typeof input.action !== 'string') throw new Error('仅接受一个 action 参数。');
        if (!ready) throw new Error('动画尚未加载。');
        return selectAction(input.action);
      }
    });
    register({
      name: 'get_l_animation', title: '读取 L 当前动作',
      description: '读取网页中的动作、当前帧和播放状态。',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).length) throw new Error('不接受额外参数。');
        return { action: selected, title: actions[selected].title, frame: frame + 1, frameCount: actions[selected].count, paused, ready };
      }
    });
    addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
})();
