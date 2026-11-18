/*
 * POSAN 시안 A·B·C 검토 사이트
 * 화면은 figma-data.js(Figma 보드에서 추출한 좌표·글자·스타일)를 그대로 HTML로 그린다.
 * 글자는 실제 텍스트, 이미지는 dist/assets/figma 의 원본 이미지, 로고·아이콘은 SVG다.
 * 1440px 프레임 기준으로 그리며, 화면이 1440보다 좁으면 비율대로 축소한다.
 */
const DATA = window.POSAN_FIGMA;

const ROUTES = {
  home: '홈',
  company: '회사소개 · About Us',
  history: '회사소개 · 연혁',
  location: '회사소개 · 찾아오시는 길',
  'company-documents': '회사소개 · 기업자료',
  library: '회사소개 · 자료실',
  'library-detail': '회사소개 · 자료실 상세',
  products: '제품소개 · 가열기구류',
  'products-imported': '제품소개 · 수입기구류',
  'product-detail-1': '제품 상세 · 살라만더 1구',
  'product-detail-2': '제품 상세 · 살라만더 2구',
  works: '사업실적 · 기업체',
  'work-detail': '사업실적 · 기업체 상세',
  contact: '문의하기',
};

// 화면 안 글자를 누르면 이동할 화면 (해당 시안에 화면이 있을 때만 연결)
const TEXT_LINKS = {
  '홈': 'home', '회사소개': 'company', '회사 소개': 'company', 'About Us': 'company', '인사말': 'company',
  '연혁': 'history', '찾아오시는 길': 'location', '기업자료': 'company-documents', '자료실': 'library',
  '제품소개': 'products', '제품 소개': 'products', '가열기구류': 'products', '가스기기': 'products', '전기기기': 'products',
  '수입기구류': 'products-imported', '커피장비': 'products-imported', '제빙기': 'products-imported', '오븐': 'products-imported',
  '사업실적': 'works', '사업 실적': 'works', '기업체': 'works',
  '문의하기': 'contact', '문의 하기': 'contact', '견적 문의하기': 'contact',
  '1구': 'product-detail-1', '2구': 'product-detail-2', '살라만더': 'product-detail-1',
  '다음 사례': 'work-detail', '한국항공우주산업 회전익동': 'work-detail',
  '주방기기 배치도 (단체급식-1)': 'library-detail',
};
const GROUP_LINKS = [
  [/살라만더/, 'product-detail-1'],
  [/한국항공우주산업/, 'work-detail'],
  [/단체급식-1/, 'library-detail'],
  [/^Floating Contact/, 'contact'],
];

// 글꼴 규칙: 한글은 KoPub돋움, 영문·숫자·기호는 Pretendard(styles.css의 'Posan Latin'). Figma에서 Noto Sans KR·Pretendard로 된 글도 같은 규칙으로 그린다.
// KoPub돋움은 Light(300)·Medium(500)·Bold(700)만 있어 400은 Medium, 600은 Bold로 표시된다.
const FONT_STACK = "'Posan Latin', 'KoPub Dotum', sans-serif";
const FONTS = { K: FONT_STACK, N: FONT_STACK, P: FONT_STACK };
const STAGE_W = 1440;
// 1440보다 넓은 화면: 위치·크기는 화면 폭 비율(--k)만큼 늘리고 글자 크기는 그대로 둔다. 1440 이하: 무대 전체를 --s로 축소.
const K = v => `calc(${+v.toFixed(2)}px * var(--k))`;
// 크기를 유지하는 작은 요소(아이콘·체크박스 등)는 중심만 비율대로 옮긴다.
const KC = (center, size) => `calc(${+center.toFixed(2)}px * var(--k) - ${+(size / 2).toFixed(2)}px)`;

const state = { concept: 'A', route: 'home', menuOpen: false };
const app = document.querySelector('#app');
const conceptButtons = [...document.querySelectorAll('[data-concept]')];

const available = concept => Object.keys(ROUTES).filter(r => DATA[concept].pages[r]);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const color = hex => {
  if (!hex) return 'transparent';
  if (hex.length === 8) return `rgba(${parseInt(hex.slice(0, 2), 16)},${parseInt(hex.slice(2, 4), 16)},${parseInt(hex.slice(4, 6), 16)},${(parseInt(hex.slice(6, 8), 16) / 255).toFixed(3)})`;
  return `#${hex}`;
};
const font = key => `font-family:${FONTS[key[0]]};font-weight:${Number(key.slice(1)) * 100};`;

function textStyle([fontKey, size, lineHeight, letterSpacing, fill]) {
  return `${font(fontKey)}font-size:${size}px;line-height:${lineHeight ? `${lineHeight}px` : 'normal'};letter-spacing:${letterSpacing}px;color:${color(fill)};`;
}

function linkFor(node, concept) {
  let route = null;
  if (node[0] === 't') {
    const text = typeof node[12] === 'string' ? node[12].trim() : '';
    route = TEXT_LINKS[text] || null;
    if (!route && /^CTA \/ |^Button \/ /.test(node[13] || '')) route = TEXT_LINKS[node[13].replace(/^(CTA|Button) \/ /, '').trim()] || null;
  } else {
    const group = node[0] === 'v' ? node[6] : node[9];
    const key = node[0] === 'v' ? node[5] : '';
    if (/logo/i.test(key)) route = 'home';
    for (const [re, r] of GROUP_LINKS) if (!route && re.test(group || '')) route = r;
    if (!route && /^(CTA|Button) \/ /.test(group || '')) route = TEXT_LINKS[group.replace(/^(CTA|Button) \/ /, '').trim()] || null;
  }
  return route && DATA[concept].pages[route] ? route : null;
}

function linkAttrs(route) {
  return route ? ` data-route="${route}" role="link" tabindex="0" aria-label="${esc(ROUTES[route])}"` : '';
}

// Figma가 실제로 끊은 줄(추출 시 SVG 내보내기에서 얻은 node[15])대로 그린다. 웹 글꼴 폭이 달라도 줄 끝 글자가 Figma와 같다.
// 양쪽 정렬 문단은 문단의 마지막 줄(다음 줄이 비었거나 원문에서 줄바꿈된 줄)을 빼고 양 끝을 맞춘다.
function renderLines(text, lines, align) {
  let at = 0;
  return lines.map((line, i) => {
    if (!line) return '<span class="ln ln--empty">&nbsp;</span>';
    for (const ch of line.replace(/\s/g, '')) { at = text.indexOf(ch, at) + 1; }
    const rest = text.slice(at);
    const hardBreak = /^[ \t]*(\n|$)/.test(rest) || !lines[i + 1];
    const justify = align === 'J' && !hardBreak;
    // 넓은 화면에서는 줄을 다시 흘려 쓰므로 원문의 띄어쓰기·줄바꿈 정보를 남긴다.
    const space = !hardBreak && /^[ \t]/.test(rest) ? ' ' : '';
    const br = hardBreak && lines[i + 1] ? ' ln--br' : '';
    return `<span class="ln${justify ? ' ln--j' : ''}${br}">${esc(line)}${space}</span>`;
  }).join('');
}

function renderText(node, concept) {
  const [, x, y, w, , ...rest] = node;
  const style = rest.slice(0, 5);
  const [align, resize, content, , opacity] = rest.slice(5);
  const hug = resize === 'W';
  let pos = `top:${K(y)};`;
  if (hug && align === 'R') pos += `right:${K(STAGE_W - x - w)};`;
  else if (hug && align === 'C') pos += `left:${K(x + w / 2)};transform:translateX(-50%);`;
  else pos += `left:${K(x)};`;
  // 글 상자가 프레임 오른쪽 끝(1440)을 넘으면 브라우저 글꼴 폭에 따라 글자가 잘릴 수 있어 프레임 안으로 줄인다.
  const boxW = align === 'L' || align === 'J' ? Math.min(w, STAGE_W - x) : w;
  if (!hug) pos += `width:${K(boxW)};`;
  const lines = !Array.isArray(content) && Array.isArray(node[15]) ? node[15] : null;
  const body = lines ? renderLines(content, lines, align)
    : Array.isArray(content)
    ? content.map(seg => `<span style="${textStyle(seg.slice(1))}">${esc(seg[0])}</span>`).join('')
    : esc(content);
  const alignCss = { L: 'left', C: 'center', R: 'right', J: 'justify' }[align] || 'left';
  const op = opacity && opacity < 1 ? `opacity:${opacity};` : '';
  const fitAttrs = hug ? '' : ` data-h="${node[4]}" data-w="${boxW}" data-x="${x}" data-align="${align}"`;
  return `<div class="t${hug ? ' t--hug' : ''}" style="${pos}${textStyle(style)}text-align:${alignCss};${op}"${fitAttrs}${linkAttrs(linkFor(node, concept))}>${body}</div>`;
}

function strokeCss(stroke) {
  if (!stroke) return '';
  const [hex, weights, align] = stroke.split(':');
  const c = color(hex);
  if (weights.includes(',')) {
    const [t, r, b, l] = weights.split(',').map(Number);
    return `border-style:solid;border-color:${c};border-width:${t}px ${r}px ${b}px ${l}px;`;
  }
  const w = Number(weights);
  if (align === 'O') return `box-shadow:0 0 0 ${w}px ${c};`;
  return `border:${w}px solid ${c};`;
}

function fillCss(fill) {
  if (!fill) return '';
  if (!fill.startsWith('i:')) return `background:${color(fill)};`;
  const [, file, mode, crop, bg] = fill.split(':');
  const base = `${bg ? `background-color:#${bg};` : ''}background-image:url('./assets/figma/${file}');background-repeat:no-repeat;`;
  if (mode === 'C' && crop) {
    const [a, d, tx, ty] = crop.split(',').map(Number);
    const px = a < 0.999 ? (tx / (1 - a)) * 100 : 0;
    const py = d < 0.999 ? (ty / (1 - d)) * 100 : 0;
    return `${base}background-size:${100 / a}% ${100 / d}%;background-position:${px}% ${py}%;`;
  }
  if (mode === 'T') return `${base}background-repeat:repeat;`;
  return `${base}background-size:cover;background-position:center;`;
}

// 카드 사진에 링크가 없으면(예: 시안 B 기업체 — 카드 6장이 한 묶음이라 사진만으로는 어느 카드인지 모름)
// 사진 바로 아래(60px 이내)·같은 왼쪽 선에 있는 제목 글자의 링크를 사진에도 건다.
function captionRoute(node, concept, page) {
  const [, x, y, , h, fill] = node;
  if (!page || !fill || !fill.startsWith('i:')) return null;
  const cap = page.n.find(n => n[0] === 't' && Math.abs(n[1] - x) < 2 && n[2] >= y + h && n[2] - (y + h) <= 60 && linkFor(n, concept));
  return cap ? linkFor(cap, concept) : null;
}

function renderShape(node, concept, page) {
  const [type, x, y, w, h, fill, stroke, radius, opacity] = node;
  const fillStyle = fillCss(fill);
  const r = type === 'e' ? 'border-radius:50%;' : radius ? `border-radius:${radius}px;` : '';
  const op = opacity < 1 ? `opacity:${opacity};` : '';
  const isImage = fill && fill.startsWith('i:');
  const small = w <= 30 && h <= 30;
  const box = small
    ? `left:${KC(x + w / 2, w)};top:${KC(y + h / 2, h)};width:${w}px;height:${h}px;`
    : `left:${K(x)};top:${K(y)};width:${w <= 1 ? `${w}px` : K(w)};height:${h <= 1 ? `${h}px` : K(h)};`;
  return `<div class="r${isImage ? ' r--img' : ''}" style="${box}${fillStyle}${strokeCss(stroke)}${r}${op}"${linkAttrs(linkFor(node, concept) || captionRoute(node, concept, page))}></div>`;
}

function renderVector(node, concept) {
  const [, x, y, w, h, key, group] = node;
  const svg = DATA[concept].svgs[key] || '';
  const isMenu = /hamburger/i.test(group || '') || /hamburger/i.test(key);
  const attrs = isMenu ? ' data-menu role="button" tabindex="0" aria-label="메뉴 열기"' : linkAttrs(linkFor(node, concept));
  // 로고·아이콘은 크기를 유지한다. 화면 오른쪽 절반에 있으면 오른쪽 끝을 기준으로 옮긴다.
  const left = x + w / 2 > STAGE_W / 2 ? `calc(${+(x + w).toFixed(2)}px * var(--k) - ${w}px)` : K(x);
  return `<div class="v" style="left:${left};top:${K(y)};width:${w}px;height:${h}px"${attrs}>${svg}</div>`;
}

// 시안 A 하위 메뉴(About Us·인사말 등, 레이어 이름 'Menu / …')는 Figma에서 KoPubWorld돋움을 쓸 수 없어 임시로 Noto Sans KR이다.
// 상위 메뉴와 같은 KoPub돋움 Medium으로 그린다(크기·행간·위치는 Figma 그대로).
// 시안 C 페이지 부제목('Page Subtitle …')도 같은 이유로 Figma에는 임시 Noto Sans KR이라 KoPub돋움 Medium으로 그린다.
const adjustNode = node => (
  node[0] === 't' && /^N/.test(node[5]) && (
    (state.concept === 'A' && node[1] < 200 && /^Menu \//.test(node[13] || ''))
    || (state.concept === 'C' && /^Page Subtitle/.test(node[13] || ''))
  )
    ? Object.assign([...node], { 5: 'K5' })
    // 시안 B 헤더 설명글은 4번째 칼럼(339)에서 시작하도록 왼쪽 기준으로 그린다(Figma는 오른쪽 정렬 자동 폭).
    : state.concept === 'B' && node[0] === 't' && /^Page Bar \/ 소개/.test(node[13] || '')
      ? Object.assign([...node], { 10: 'L' })
      : node
);

// 화면에 고정되는 요소: 플로팅 버튼(모든 시안) + 그 위의 카카오톡·대표번호(시안 A·B)
const isFloating = node => node[0] === 'v' && /^FloatingCont/i.test(node[5]);
const isDockText = node => node[0] === 't' && node[1] < 200 && node[2] > 600 && /^(카카오톡|02-6232-8100)$/.test(String(node[12]).trim());

function renderDock(page) {
  const floating = page.n.filter(isFloating);
  if (!floating.length) return '';
  // 시안 A·B: 버튼 10% 축소, 카카오톡·대표번호와 버튼의 왼쪽 선을 메뉴 왼쪽 선에 맞추고 글자 설정도 메뉴와 같게 한다.
  const menuLike = ['A', 'B'].includes(state.concept);
  // 기준 글자: 왼쪽 메뉴에서 선택(빨강)·굵게가 아닌 일반 항목. 메뉴가 없는 화면(시안 B 홈)은 Figma 값 그대로.
  const leftMenu = menuLike ? page.n.map(adjustNode).filter(n => n[0] === 't' && n[1] < 200 && n[2] > 100 && n[2] < 600 && !isDockText(n)) : [];
  const menu = leftMenu.find(n => /^K5/.test(n[5]) && !/^ee1720/i.test(n[9]));
  const menuX = leftMenu.length ? Math.min(...leftMenu.map(n => n[1])) : 0;
  const btnScale = menuLike ? 0.9 : 1;
  const items = [...floating, ...page.n.filter(isDockText)].map(n => {
    if (!menu) return n;
    const c = [...n];
    c[1] = menuX;
    if (c[0] === 't') { c.splice(5, 5, ...menu.slice(5, 10)); c[4] = menu[4]; }
    return c;
  });
  const bottom = n => n[2] + n[4] * (n[0] === 'v' ? btnScale : 1);
  const x1 = Math.min(...items.map(n => n[1])), y1 = Math.min(...items.map(n => n[2]));
  const x2 = Math.max(...items.map(n => n[1] + n[3])), y2 = Math.max(...items.map(bottom));
  const shift = n => { const c = [...n]; c[1] -= x1; c[2] -= y1; return c; };
  // 플로팅 버튼 SVG는 그림자까지 포함해 100×100으로 내보내져 있다(원은 60×60, 그림자 좌우 20·위 14 확장).
  // 원 크기를 유지하도록 그림자 영역만큼 바깥으로 넓혀 그린다. 프레임 가장자리에서 잘린 SVG 대신 온전한 것을 쓴다.
  const fullSvg = Object.values(DATA).flatMap(d => Object.entries(d.svgs))
    .filter(([k]) => /^FloatingCont/i.test(k)).map(([, s]) => s)
    .sort((a, b) => Number((b.match(/width="([\d.]+)"/) || [0, 0])[1]) - Number((a.match(/width="([\d.]+)"/) || [0, 0])[1]))[0] || '';
  const renderFloating = n => {
    const route = DATA[state.concept].pages.contact ? 'contact' : null;
    return `<div class="v v--floating" style="left:${n[1] - x1 - 20 * btnScale}px;top:${n[2] - y1 - 14 * btnScale}px;width:${100 * btnScale}px;height:${100 * btnScale}px"${linkAttrs(route)}>${fullSvg}</div>`;
  };
  const inner = items.map(n => (n[0] === 'v' ? renderFloating(n) : renderText(shift(n), state.concept)))
    .join('')
    .replace(/right:(-?[\d.]+)px/g, (m, v) => `right:${Number(v) - (STAGE_W - (x2 - x1))}px`);
  // 왼쪽 = 메뉴 왼쪽 선(넓은 화면에서는 가운데 정렬된 화면을 따라감), 아래 여백 = 같은 값(모니터 아래 끝 기준)
  return `<div class="dock" style="--margin:${x1};width:${x2 - x1}px;height:${y2 - y1}px">${inner}</div>`;
}

function renderPage() {
  const page = DATA[state.concept].pages[state.route];
  // 시안 A 기업체 Figma에 메뉴 칸 안으로 잘못 들어간 카카오톡·대표번호 중복 레이어('Menu / 카카오톡' 등)는 그리지 않는다(화면 고정 영역에 이미 있음).
  const isStrayDock = node => node[0] === 't' && node[1] < 200 && node[2] < 700 && /^Menu \/ (카카오톡|02-6232-8100)$/.test(node[13] || '');
  const nodes = page.n.filter(node => !isFloating(node) && !isDockText(node) && !isStrayDock(node)).map(adjustNode).map(node => {
    if (node[0] === 't') return renderText(node, state.concept);
    if (node[0] === 'v') return renderVector(node, state.concept);
    return renderShape(node, state.concept, page);
  }).join('');
  // 햄버거 아이콘(막대 도형 묶음) 위에 누를 수 있는 영역을 둔다
  const bars = page.n.filter(node => /hamburger/i.test((node[0] === 'v' ? node[6] : node[9]) || ''));
  let hit = '';
  if (bars.length) {
    const x1 = Math.min(...bars.map(b => b[1])), y1 = Math.min(...bars.map(b => b[2]));
    const x2 = Math.max(...bars.map(b => b[1] + b[3])), y2 = Math.max(...bars.map(b => b[2] + b[4]));
    const hw = x2 - x1 + 16, hh = y2 - y1 + 16;
    hit = `<button type="button" class="hit" data-menu aria-label="메뉴 열기" style="left:${KC((x1 + x2) / 2, hw)};top:${KC((y1 + y2) / 2, hh)};width:${hw}px;height:${hh}px"></button>`;
  }
  return `<main class="frame" style="--h:${page.h}px;background:${color(page.bg || 'ffffff')}" aria-label="${esc(ROUTES[state.route])}"><div class="stage" style="height:${K(page.h)}">${nodes}${hit}</div></main>`;
}

// 시안 C 햄버거 메뉴: Figma '홈-C (텔로 스펙 · 12GRID M15 G18 C101)-메뉴'(1568:16952) 디자인.
// 화면 전체 10% 검정 딤 + 오른쪽 235px 패널(흰색 90%, 배경 블러 4). 항목은 페이지마다 바뀐다(pageMenuTree).
const CLOSE_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4L20 20M20 4L4 20" stroke="#121212" stroke-width="1.5"/></svg>';

// 시안 C 메뉴 항목은 시안 A의 같은 페이지 왼쪽 메뉴(펼쳐진 하위 메뉴·들여쓰기·현재 페이지 빨강)를 그대로 따른다.
function pageMenuTree(route) {
  const page = DATA.A.pages[route] || DATA.A.pages.home;
  const texts = page.n.filter(n => n[0] === 't' && n[1] < 200 && n[2] > 80 && n[2] < 700 && !isDockText(n)
    && !/^Menu \/ (카카오톡|02-6232-8100)$/.test(n[13] || '') && String(n[12]).trim()).sort((a, b) => a[2] - b[2]);
  const xs = [...new Set(texts.map(n => Math.round(n[1])))].sort((a, b) => a - b);
  return texts.map(n => ({ label: String(n[12]).trim(), level: xs.indexOf(Math.round(n[1])), active: /^ee1720/i.test(n[9]) }));
}

function cMenuPanel() {
  const tree = pageMenuTree(state.route);
  const items = tree.map(({ label, level, active }, i) => {
    const route = TEXT_LINKS[label];
    const style = `top:${85 + i * 36}px;left:calc(28px * var(--k) + ${level * 12}px)`;
    const cls = `c-menu__item${active ? ' is-active' : ''}`;
    return route && DATA.C.pages[route]
      ? `<button type="button" class="${cls}" style="${style}" data-route="${route}"${active ? ' aria-current="page"' : ''}>${esc(label)}</button>`
      : `<span class="${cls}" style="${style}">${esc(label)}</span>`;
  }).join('');
  return `<div class="c-menu${state.menuOpen ? ' is-open' : ''}" aria-hidden="${!state.menuOpen}">`
    + '<div class="c-menu__dim" data-menu aria-hidden="true"></div>'
    + `<nav class="c-menu__panel" aria-label="메뉴"><div class="c-menu__inner" style="height:${85 + tree.length * 36}px"><button type="button" class="c-menu__close" data-menu aria-label="메뉴 닫기">${CLOSE_SVG}</button>${items}</div></nav></div>`;
}

function menuPanel() {
  if (state.concept === 'C') return cMenuPanel();
  const items = available(state.concept).filter(r => !/detail/.test(r));
  return `<nav class="menu-panel${state.menuOpen ? ' is-open' : ''}" aria-hidden="${!state.menuOpen}" aria-label="화면 목록"><button type="button" class="menu-close" data-menu>닫기</button><ul>${items.map(r => `<li><button type="button" data-route="${r}" class="${r === state.route ? 'is-active' : ''}">${ROUTES[r]}</button></li>`).join('')}</ul></nav>`;
}

// 웹 글꼴이 Figma보다 1~2% 넓게 그려져 줄이 하나 더 생기는 글 상자만, 정렬 기준을 지키며 최대 4%까지 넓힌다.
function fitTextWraps() {
  const wide = app.querySelector('.frame.is-wide');
  app.querySelectorAll('.t[data-h]').forEach(el => {
    const target = Number(el.dataset.h) + 2;
    const w = Number(el.dataset.w), left = Number(el.dataset.x);
    const place = (width, x) => { el.style.width = K(width); el.style.left = K(x); };
    place(w, left);
    // 넓은 화면은 글 상자가 넓어져 줄이 늘지 않는다. 1440 이하에서만 넘치는 상자를 조금 넓힌다.
    if (wide || el.offsetHeight <= target) return;
    for (let extra = 2; extra <= Math.ceil(w * 0.04); extra += 2) {
      place(w + extra, el.dataset.align === 'C' ? left - extra / 2 : el.dataset.align === 'R' ? left - extra : left);
      if (el.offsetHeight <= target) return;
    }
    place(w, left);
  });
}

function fit() {
  const frame = app.querySelector('.frame');
  if (!frame) return;
  const width = document.documentElement.clientWidth;
  const scale = Math.min(1, width / STAGE_W);
  const k = Math.max(1, width / STAGE_W);
  const wasWide = frame.classList.contains('is-wide');
  frame.classList.toggle('is-wide', k > 1.0005);
  for (const el of [frame, app.querySelector('.dock'), app.querySelector('.c-menu')]) {
    if (!el) continue;
    el.style.setProperty('--s', scale);
    el.style.setProperty('--k', k);
    el.style.setProperty('--offset', '0px');
  }
  if (wasWide !== frame.classList.contains('is-wide')) fitTextWraps();
}

function readState() {
  const query = new URLSearchParams(location.search);
  const concept = (query.get('concept') || '').toUpperCase();
  if (DATA[concept]) state.concept = concept;
  const route = query.get('page');
  if (route && DATA[state.concept].pages[route]) state.route = route;
}

function writeState() {
  if (location.protocol === 'file:') return;
  history.replaceState(null, '', `${location.pathname}?${new URLSearchParams({ concept: state.concept, page: state.route })}`);
}

function render(scroll = false) {
  document.body.dataset.variant = state.concept.toLowerCase();
  document.title = `POSAN 시안 ${state.concept} — ${ROUTES[state.route]}`;
  app.innerHTML = `${renderPage()}${renderDock(DATA[state.concept].pages[state.route])}${menuPanel()}`;
  conceptButtons.forEach(b => b.classList.toggle('is-active', b.dataset.concept === state.concept));
  fit();
  fitTextWraps();
  document.fonts?.ready.then(fitTextWraps);
  writeState();
  if (scroll) window.scrollTo({ top: 0 });
}

function setConcept(concept) {
  state.concept = concept;
  if (!DATA[concept].pages[state.route]) {
    const fallback = { 'library-detail': 'library', 'product-detail-1': 'product-detail-2' }[state.route];
    state.route = fallback && DATA[concept].pages[fallback] ? fallback : 'home';
  }
  state.menuOpen = false;
  render();
}

function go(route) {
  if (!DATA[state.concept].pages[route]) return;
  state.route = route;
  state.menuOpen = false;
  render(true);
}

document.addEventListener('click', e => {
  const concept = e.target.closest('[data-concept]');
  if (concept) { setConcept(concept.dataset.concept); return; }
  if (e.target.closest('[data-menu]')) { state.menuOpen = !state.menuOpen; render(); return; }
  const link = e.target.closest('[data-route]');
  if (link) go(link.dataset.route);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('[data-route]')) { go(e.target.dataset.route); return; }
  if (e.key === 'Enter' && e.target.matches('[data-menu]')) { state.menuOpen = !state.menuOpen; render(); return; }
  if (['1', '2', '3'].includes(e.key) && !e.target.matches('input,textarea')) setConcept(['A', 'B', 'C'][Number(e.key) - 1]);
  if (e.key === 'Escape' && state.menuOpen) { state.menuOpen = false; render(); }
});
window.addEventListener('resize', fit);
window.addEventListener('popstate', () => { readState(); render(); });

// Figma 대조용 읽기 전용 메타데이터
window.__POSAN_AUDIT__ = Object.freeze({
  available: Object.freeze(Object.fromEntries(['A', 'B', 'C'].map(c => [c, Object.freeze(available(c))]))),
});

readState();
render();
