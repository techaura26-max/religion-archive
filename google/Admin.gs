function owner_() {
  const active = Session.getActiveUser().getEmail();
  const effective = Session.getEffectiveUser().getEmail();
  const owner = PropertiesService.getScriptProperties().getProperty('ARCHIVE_OWNER_EMAIL');
  if (!active || !effective || active.toLowerCase() !== effective.toLowerCase()
      || (owner && active.toLowerCase() !== owner)) {
    throw new Error('افتح اللوحة باستخدام حساب Google المالك.');
  }
}

function doGet() {
  owner_();
  return HtmlService.createHtmlOutputFromFile('Admin').setTitle('إدارة RELIGION ARCHIVE');
}

function setupArchive() {
  owner_();
  return locked_(() => {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('ARCHIVE_OWNER_EMAIL', Session.getEffectiveUser().getEmail().toLowerCase());
    if (props.getProperty('ARCHIVE_ROOT_ID')) {
      const id = root_().getId();
      console.log('ARCHIVE_ROOT_ID = ' + id);
      return id;
    }
    const folder = DriveApp.createFolder('RELIGION ARCHIVE');
    ['topics', 'articles', 'images'].forEach(name => folder.createFolder(name));
    props.setProperty('ARCHIVE_ROOT_ID', folder.getId());
    console.log('ARCHIVE_ROOT_ID = ' + folder.getId());
    return folder.getId();
  });
}

function locked_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function adminIndex() {
  owner_();
  const topics = sortItems_(records_(folder_('topics')));
  const articles = records_(folder_('articles')).map(({id, rev, draft, live}) => ({
    id, rev, topicId: draft.topicId, title: draft.title, order: draft.order, published: Boolean(live)
  }));
  return {topics, articles: sortItems_(articles)};
}

function adminArticle(id) {
  owner_();
  return record_(ownedFile_(folder_('articles'), id));
}

function title_(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 180) {
    throw new Error('اكتب عنواناً بين 1 و180 حرفاً.');
  }
  return value.trim();
}

function order_(value) {
  if (!Number.isSafeInteger(value)) throw new Error('اكتب رقماً صحيحاً للترتيب.');
  return value;
}

function writeRecord_(folder, id, rev, value, existing) {
  const file = id ? (existing || ownedFile_(folder, id)) : null;
  const previous = file ? record_(file) : null;
  if (previous && previous.rev !== rev) throw new Error('تم تعديل العنصر من مكان آخر. حدّث اللوحة أولاً.');
  const next = Object.assign({}, value, {rev: previous ? previous.rev + 1 : 1});
  const json = JSON.stringify(next);
  if (Utilities.newBlob(json).getBytes().length > 1024 * 1024) throw new Error('حجم نص المقال يتجاوز 1 ميغابايت.');
  const saved = file ? file.setContent(json) : folder.createFile(Utilities.newBlob(json, 'application/json', Utilities.getUuid() + '.json'));
  return Object.assign(next, {id: saved.getId()});
}

function adminSaveTopic(input) {
  owner_();
  if (!RELIGIONS_.includes(input.religion)) throw new Error('اختر ديانة.');
  return locked_(() => writeRecord_(folder_('topics'), input.id, input.rev, {
    religion: input.religion, title: title_(input.title), order: order_(input.order)
  }));
}

function adminDeleteTopic(id, rev) {
  owner_();
  return locked_(() => {
    const file = ownedFile_(folder_('topics'), id);
    if (record_(file).rev !== rev) throw new Error('تم تعديل الموضوع. حدّث اللوحة.');
    if (records_(folder_('articles')).some(({draft, live}) => draft.topicId === id || (live && live.topicId === id))) {
      throw new Error('انقل أو احذف مقالات الموضوع أولاً، بما فيها النسخ المنشورة.');
    }
    file.setTrashed(true);
    return true;
  });
}

function adminSaveArticle(input, action) {
  owner_();
  if (!['draft', 'publish', 'hide'].includes(action)) throw new Error('العملية غير مدعومة.');
  return locked_(() => {
    const articles = folder_('articles');
    const file = input.id ? ownedFile_(articles, input.id) : null;
    const previous = file ? record_(file) : null;
    ownedFile_(folder_('topics'), input.topicId);
    const images = folder_('images');
    if (!Array.isArray(input.blocks)) throw new Error('محتوى المقال غير صالح.');
    const blocks = input.blocks.map(block => {
      if (block.type === 'image') {
        const image = ownedFile_(images, block.id);
        if (!IMAGE_MIME_.includes(image.getMimeType())) throw new Error('الصورة غير صالحة.');
        return {type: 'image', id: block.id, alt: String(block.alt || '').slice(0, 300)};
      }
      if (!['p', 'h2', 'h3', 'quote', 'references'].includes(block.type) || typeof block.html !== 'string' || typeof block.text !== 'string') {
        throw new Error('كتلة المقال غير صالحة.');
      }
      return {type: block.type, html: block.html, text: block.text};
    });
    const draft = {topicId: input.topicId, title: title_(input.title), order: order_(input.order), blocks};
    const live = action === 'publish' ? draft : action === 'hide' ? null : previous && previous.live;
    return writeRecord_(articles, input.id, input.rev, {draft, live}, file);
  });
}

function adminDeleteArticle(id, rev) {
  owner_();
  return locked_(() => {
    const file = ownedFile_(folder_('articles'), id);
    if (record_(file).rev !== rev) throw new Error('تم تعديل المقال. حدّث اللوحة.');
    file.setTrashed(true);
    return true;
  });
}

function adminUploadImage(mime, encoded) {
  owner_();
  if (!IMAGE_MIME_.includes(mime) || typeof encoded !== 'string' || encoded.length > Math.ceil(MAX_IMAGE_ / 3) * 4) {
    throw new Error('ارفع صورة PNG أو JPEG أو WebP أو GIF حتى 3 ميغابايت.');
  }
  const bytes = Utilities.base64Decode(encoded);
  const header = bytes.slice(0, 12).map(byte => byte & 255);
  const starts = (...values) => values.every((value, index) => header[index] === value);
  const valid = (mime === 'image/png' && starts(137, 80, 78, 71, 13, 10, 26, 10))
    || (mime === 'image/jpeg' && starts(255, 216, 255))
    || (mime === 'image/gif' && starts(71, 73, 70, 56))
    || (mime === 'image/webp' && starts(82, 73, 70, 70) && header.slice(8).join() === '87,69,66,80');
  if (!valid || bytes.length > MAX_IMAGE_) throw new Error('بيانات الصورة غير صالحة.');
  const extension = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
  const image = folder_('images').createFile(Utilities.newBlob(bytes, mime, Utilities.getUuid() + '.' + extension));
  return {id: image.getId()};
}

function adminImage(id) {
  owner_();
  return imageData_(ownedFile_(folder_('images'), id));
}
