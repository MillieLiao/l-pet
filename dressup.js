(() => {
  'use strict';
  const outfits = {
    original: { title: '日常毛衣', en: 'EVERYDAY L', caption: '还是你熟悉的那个 L。', alt: 'L 穿着驼色毛衣，戴着深灰圆眼镜', source: 'original.png' },
    butler: { title: '小管家', en: 'LITTLE BUTLER', caption: '蝴蝶结系好了，今天也请多关照。', alt: 'L 戴着圆眼镜，穿黑白小管家服和奶油色围裙', source: 'butler.webp' },
    chef: { title: '小厨师', en: 'LITTLE CHEF', caption: '今天的小幸福，刚刚出炉。', alt: 'L 戴着圆眼镜和厨师帽，穿奶油色厨师服，手持锅铲', source: 'chef.webp' },
    cat: { title: '小猫咪', en: 'CAT-EARED L', caption: '听说，摸摸头就会开心一点。', alt: 'L 戴着猫耳和圆眼镜，穿驼色毛衣', source: 'cat.webp' },
    bunny: { title: '兔兔套装', en: 'BUNNY L', caption: '今天的任务：可爱地萌混过关。', alt: 'L 戴着圆眼镜，穿奶油色垂耳兔兔连体衣，双手托腮', source: 'bunny.webp' },
    mahjong: { title: '麻将小高手', en: 'LUCKY LITTLE L', caption: '绿衣服穿上，好心情也跟着来了。', alt: 'L 戴着圆眼镜，穿绿色中式长袍，举着红中字麻将牌', source: 'mahjong.webp' },
    prince: { title: '小王子', en: 'LITTLE PRINCE', caption: '戴好小皇冠，今天也闪闪发光。', alt: 'L 戴着深灰圆眼镜和金色小皇冠，穿蓝金王子礼服与酒红披风', source: 'prince.webp' },
    pig: { title: '小猪套装', en: 'PIGGY L', caption: '粉粉嫩嫩，快乐也圆滚滚。', alt: 'L 戴着深灰圆眼镜，黑色刘海露在粉色小猪连体衣的帽子里', source: 'pig.webp' },
    assassin: { title: '小杀手', en: 'STEALTH L', caption: '悄悄出场，酷酷地陪着你。', alt: 'L 戴着深灰圆眼镜，穿黑色兜帽潜行服、手套和短靴，脸部完整露出', source: 'assassin.webp' }
  };
  const backgrounds = { honey: '奶油黄', rose: '桃子粉', blue: '天空蓝' };
  const ids = Object.keys(outfits);
  const card = document.getElementById('fitting-card');
  const stage = document.getElementById('fitting-stage');
  const avatar = document.getElementById('dressed-l');
  const status = document.getElementById('room-status');
  const error = document.getElementById('room-error');
  const mobileOutfit = document.getElementById('mobile-outfit');
  const buttons = [...document.querySelectorAll('button[data-outfit]')];
  const backgroundButtons = [...document.querySelectorAll('button[data-background]')];
  const cache = new Map();
  let selected = 'original', background = 'honey', sequence = 0;

  function state() {
    return { outfit: selected, title: outfits[selected].title, background, backgroundTitle: backgrounds[background] };
  }
  function loadOutfit(id) {
    if (!cache.has(id)) {
      const image = new Image();
      image.src = outfits[id].source;
      const promise = image.decode().then(() => image).catch(reason => { cache.delete(id); throw reason; });
      cache.set(id, promise);
    }
    return cache.get(id);
  }
  async function selectOutfit(id) {
    if (!Object.hasOwn(outfits, id)) throw new Error('请选择衣橱中已有的一套服装。');
    const ticket = ++sequence;
    stage.setAttribute('aria-busy', 'true');
    error.hidden = true;
    status.textContent = `正在为 L 换上${outfits[id].title}…`;
    try {
      await loadOutfit(id);
      if (ticket !== sequence) return state();
      avatar.src = outfits[id].source;
      avatar.alt = outfits[id].alt;
      selected = id;
      buttons.forEach(button => {
        const active = button.dataset.outfit === id;
        button.classList.toggle('selected', active);
        button.setAttribute('aria-pressed', String(active));
      });
      mobileOutfit.value = id;
      document.getElementById('outfit-index').textContent = `${String(ids.indexOf(id) + 1).padStart(2, '0')} / ${String(ids.length).padStart(2, '0')}`;
      document.getElementById('outfit-name').textContent = outfits[id].title;
      document.getElementById('outfit-en').textContent = outfits[id].en;
      document.getElementById('outfit-caption').textContent = outfits[id].caption;
      status.textContent = `L 已换上${outfits[id].title}。`;
      return state();
    } catch {
      if (ticket === sequence) {
        mobileOutfit.value = selected;
        status.textContent = `L 仍然穿着${outfits[selected].title}。`;
        error.textContent = '这套衣服暂时没有加载成功，点选它可以重试。';
        error.hidden = false;
      }
      throw new Error('服装图片未加载成功。');
    } finally {
      if (ticket === sequence) stage.setAttribute('aria-busy', 'false');
    }
  }
  function setBackground(id) {
    if (!Object.hasOwn(backgrounds, id)) throw new Error('请选择有效的背景颜色。');
    background = id;
    card.dataset.background = id;
    backgroundButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.background === id)));
    status.textContent = `已切换为${backgrounds[id]}背景。`;
    return state();
  }
  buttons.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => selectOutfit(button.dataset.outfit).catch(() => {}));
  });
  backgroundButtons.forEach(button => button.addEventListener('click', () => setBackground(button.dataset.background)));
  mobileOutfit.addEventListener('change', () => selectOutfit(mobileOutfit.value).catch(() => {}));
  const random = document.getElementById('random-outfit');
  random.disabled = false;
  random.addEventListener('click', () => {
    const choices = ids.filter(id => id !== selected);
    selectOutfit(choices[Math.floor(Math.random() * choices.length)]).catch(() => {});
  });
  // Decode other full-body assets on demand, reusing the thumbnail request cache.
  loadOutfit('original').catch(() => {
    error.textContent = '日常毛衣的图片没有加载成功，请刷新页面重试。';
    error.hidden = false;
  });
  const context = document.modelContext;
  if (context?.registerTool) {
    const lifecycle = new AbortController();
    const register = tool => {
      try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {}
    };
    register({
      name: 'set_l_outfit', title: '给网页里的 L 换装',
      description: '选择 L 换装室里的一套完整服装，只改变可见网页，不会修改桌宠。',
      inputSchema: { type: 'object', properties: { outfit: { type: 'string', enum: ids } }, required: ['outfit'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).length !== 1 || typeof input.outfit !== 'string') throw new Error('仅接受一个 outfit 参数。');
        return selectOutfit(input.outfit);
      }
    });
    register({
      name: 'get_l_outfit', title: '读取网页里 L 的穿搭',
      description: '读取当前可见服装和背景颜色。',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).length) throw new Error('不接受额外参数。');
        return state();
      }
    });
    addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
})();
