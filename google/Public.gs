function doGet(event) {
  const params = event.parameter;
  const callback = params.callback || '';
  if (!/^ra_[a-f0-9]{32}$/.test(callback)) {
    return ContentService.createTextOutput('Invalid callback');
  }
  let result;
  try {
    switch (params.action) {
      case 'index': result = publicIndex_(params.q || ''); break;
      case 'article': result = publicArticle_(params.id); break;
      case 'image': result = publicImage_(params.id, params.image); break;
      default: throw new Error('طلب غير معروف.');
    }
    result = {ok: true, data: result};
  } catch (error) {
    console.error(error);
    result = {ok: false, error: 'تعذّر تحميل المحتوى. قد يكون محذوفاً أو غير منشور.'};
  }
  const encoded = JSON.stringify(result).replace(/[<\u2028\u2029]/g, char =>
    '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
  return ContentService.createTextOutput(callback + '(' + encoded + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function publicIndex_(query) {
  const q = normalizeSearch_(String(query).slice(0, 160).trim());
  const topics = sortItems_(records_(folder_('topics'))).map(({id, religion, title, order}) => ({id, religion, title, order}));
  const topicById = new Map(topics.map(topic => [topic.id, topic]));
  const articles = [];
  for (const {id, live} of records_(folder_('articles'))) {
    if (!live || !topicById.has(live.topicId)) continue;
    if (q) {
      const text = [live.title, topicById.get(live.topicId).title, ...live.blocks.map(block => block.text || block.alt || '')].join(' ');
      if (!normalizeSearch_(text).includes(q)) continue;
    }
    articles.push({id, topicId: live.topicId, title: live.title, order: live.order});
  }
  return {topics: q ? topics.filter(topic => normalizeSearch_(topic.title).includes(q)) : topics, articles: sortItems_(articles)};
}

function publicArticle_(id) {
  const {live} = record_(ownedFile_(folder_('articles'), id));
  if (!live) throw new Error('المقال غير منشور.');
  const {religion, title} = record_(ownedFile_(folder_('topics'), live.topicId));
  const blocks = live.blocks.map(block => block.type === 'image'
    ? {type: 'image', id: block.id, alt: block.alt}
    : {type: block.type, html: block.html});
  return {id, title: live.title, topicId: live.topicId, topicTitle: title, religion, blocks};
}

function publicImage_(articleId, imageId) {
  const article = publicArticle_(articleId);
  if (!article.blocks.some(block => block.type === 'image' && block.id === imageId)) {
    throw new Error('الصورة غير منشورة في المقال.');
  }
  return imageData_(ownedFile_(folder_('images'), imageId));
}
