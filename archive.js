'use strict';

const names = {islam: 'الإسلام', christianity: 'المسيحية', judaism: 'اليهودية'};
const routes = new URLSearchParams(location.search);
const view = document.querySelector('#view');

function deploymentUrl(value) {
  try {
    const url = new URL(value);
    if (url.origin === 'https://script.google.com' && /^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname)) return url;
  } catch {
    return null;
  }
  return null;
}

const publicUrl = deploymentUrl(window.archiveConfig?.publicUrl);
const adminUrl = deploymentUrl(window.archiveConfig?.adminUrl);
if (adminUrl) {
  const link = document.querySelector('#admin-link');
  link.href = adminUrl.href;
  link.hidden = false;
}

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function link(label, href, className) {
  const node = element('a', label, className);
  node.href = href;
  return node;
}

function route(key, value) {
  return '?' + new URLSearchParams({[key]: value});
}

function page(title, crumbs = [], article = false) {
  view.className = article ? 'shell page article' : 'shell page';
  document.title = title + ' | RELIGION ARCHIVE';
  const nav = element('nav', '', 'crumbs');
  nav.setAttribute('aria-label', 'مسار الصفحة');
  nav.append(link('الرئيسية', './'));
  for (const [label, href] of crumbs) {
    const divider = element('span', '/');
    divider.setAttribute('aria-hidden', 'true');
    nav.append(divider, link(label, href));
  }
  view.replaceChildren(nav, element('h1', title));
}

function notice(text) {
  const node = element('p', text, 'notice');
  node.setAttribute('role', 'status');
  return node;
}

function request(action, params = {}) {
  if (!publicUrl) return Promise.reject(new Error('الأرشيف بانتظار ربط خدمة المحتوى.'));
  return new Promise((resolve, reject) => {
    const callback = 'ra_' + crypto.randomUUID().replaceAll('-', '');
    const url = new URL(publicUrl);
    url.search = new URLSearchParams({...params, action, callback});
    const script = document.createElement('script');
    script.src = url.href;
    const cleanup = () => {
      clearTimeout(timer);
      script.remove();
      delete window[callback];
    };
    const fail = () => {
      cleanup();
      reject(new Error('تعذّر الاتصال بخدمة المحتوى. جرّب تحديث الصفحة.'));
    };
    const timer = setTimeout(fail, 25000);
    script.onerror = fail;
    window[callback] = response => {
      cleanup();
      if (response.ok) resolve(response.data);
      else reject(new Error(response.error));
    };
    document.head.append(script);
  });
}

function entries(items, type, empty) {
  if (!items.length) return notice(empty);
  const grid = element('div', '', 'entries');
  for (const item of items) grid.append(link(item.title, route(type, item.id), 'entry'));
  return grid;
}

const allowed = new Set(['a', 'b', 'br', 'code', 'div', 'em', 'i', 'li', 'ol', 'p', 's', 'span', 'strong', 'u', 'ul']);
const discard = new Set(['script', 'style', 'iframe', 'object', 'template', 'svg', 'math']);

function appendRich(target, html) {
  const source = document.createElement('template');
  source.innerHTML = html;
  function copy(input, output) {
    for (const child of input.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) output.append(document.createTextNode(child.data));
      if (child.nodeType !== Node.ELEMENT_NODE || discard.has(child.localName)) continue;
      if (!allowed.has(child.localName)) {
        copy(child, output);
        continue;
      }
      const node = element(child.localName);
      if (node.localName === 'a') {
        const href = child.getAttribute('href');
        try {
          const url = new URL(href);
          if (url.protocol === 'https:' || url.protocol === 'http:') {
            node.href = url.href;
            node.rel = 'noopener noreferrer';
          }
        } catch {
          // Leave text links without a valid URL inert.
        }
      }
      copy(child, node);
      output.append(node);
    }
  }
  copy(source.content, target);
}

const pendingImages = [];
const imageRequests = new Map();
let activeImages = 0;
function runImages() {
  while (activeImages < 3 && pendingImages.length) {
    const {article, id, resolve, reject, key} = pendingImages.shift();
    activeImages++;
    request('image', {id: article, image: id}).then(resolve, error => {
      imageRequests.delete(key);
      reject(error);
    }).finally(() => {
      activeImages--;
      runImages();
    });
  }
}

function loadImage(article, id) {
  const key = article + '/' + id;
  if (!imageRequests.has(key)) {
    imageRequests.set(key, new Promise((resolve, reject) => {
      pendingImages.push({article, id, resolve, reject, key});
    }));
    runImages();
  }
  return imageRequests.get(key);
}

const imageObserver = new IntersectionObserver(items => {
  for (const item of items) {
    if (!item.isIntersecting) continue;
    imageObserver.unobserve(item.target);
    item.target.dispatchEvent(new Event('loadarchiveimage'));
  }
}, {rootMargin: '240px'});

function imageBlock(block, articleId) {
  const figure = element('figure');
  const img = element('img');
  img.alt = block.alt || 'صورة من المقال';
  img.decoding = 'async';
  const status = notice('جارٍ تحميل الصورة…');
  figure.append(img, status);
  if (block.alt) figure.append(element('figcaption', block.alt));
  async function show() {
    status.textContent = 'جارٍ تحميل الصورة…';
    try {
      const data = await loadImage(articleId, block.id);
      if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(data)) throw new Error();
      img.src = data;
      status.remove();
    } catch {
      status.textContent = 'تعذّر تحميل الصورة. ';
      const retry = element('button', 'إعادة المحاولة');
      retry.addEventListener('click', show, {once: true});
      status.append(retry);
    }
  }
  figure.addEventListener('loadarchiveimage', show, {once: true});
  imageObserver.observe(figure);
  return figure;
}

async function articleView(id) {
  page('المقال');
  const status = notice('جارٍ التحميل…');
  view.append(status);
  const article = await request('article', {id});
  page(article.title, [
    [names[article.religion], route('religion', article.religion)],
    [article.topicTitle, route('topic', article.topicId)]
  ], true);
  const body = element('article', '', 'article-body');
  const tags = {p: 'div', h2: 'h2', h3: 'h3', quote: 'blockquote', references: 'section'};
  for (const block of article.blocks) {
    if (block.type === 'image') body.append(imageBlock(block, id));
    else if (Object.hasOwn(tags, block.type)) {
      const node = element(tags[block.type], '', block.type);
      appendRich(node, block.html);
      body.append(node);
    }
  }
  view.append(body);
}

function searchView(query) {
  page('بحث');
  const form = element('form', '', 'search');
  const input = element('input');
  input.type = 'search';
  input.name = 'search';
  input.placeholder = 'ابحث في المواضيع والمقالات';
  input.setAttribute('aria-label', input.placeholder);
  input.value = query;
  input.maxLength = 160;
  form.append(input, element('button', 'بحث'));
  view.append(form);
}

async function browse() {
  const articleId = routes.get('article');
  const topicId = routes.get('topic');
  const religion = routes.get('religion');
  const query = routes.get('search');
  if (articleId) return articleView(articleId);
  if (!religion && !topicId && query === null) return;
  if (query !== null) searchView(query);
  else if (religion && Object.hasOwn(names, religion)) page(names[religion]);
  else page('الموضوع');
  if (query !== null && !query.trim()) return;
  const status = notice('جارٍ التحميل…');
  view.append(status);
  const {topics, articles} = await request('index', query === null ? {} : {q: query.trim()});
  status.remove();
  if (query !== null) {
    if (topics.length) view.append(element('h2', 'المواضيع'), entries(topics, 'topic'));
    if (articles.length) view.append(element('h2', 'المقالات'), entries(articles, 'article'));
    if (!topics.length && !articles.length) view.append(notice('ما في نتائج مطابقة.'));
  } else if (topicId) {
    const topic = topics.find(item => item.id === topicId);
    if (!topic) throw new Error('الموضوع غير موجود.');
    page(topic.title, [[names[topic.religion], route('religion', topic.religion)]]);
    view.append(entries(articles.filter(item => item.topicId === topicId), 'article', 'ما في مقالات منشورة بهالموضوع.'));
  } else {
    view.append(entries(topics.filter(item => item.religion === religion), 'topic', 'ما في مواضيع بهالقسم بعد.'));
  }
}

browse().catch(error => {
  const status = view.querySelector('[role=status]');
  if (status) status.textContent = error.message;
  else view.append(notice(error.message));
});
