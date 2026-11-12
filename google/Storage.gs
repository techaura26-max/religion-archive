const RELIGIONS_ = ['islam', 'christianity', 'judaism'];
const MAX_IMAGE_ = 3 * 1024 * 1024;
const IMAGE_MIME_ = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function root_() {
  const id = PropertiesService.getScriptProperties().getProperty('ARCHIVE_ROOT_ID');
  if (!id) throw new Error('اضبط ARCHIVE_ROOT_ID أولاً.');
  return DriveApp.getFolderById(id);
}

function folder_(name) {
  const folders = root_().getFoldersByName(name);
  if (!folders.hasNext()) throw new Error('مجلد الأرشيف مفقود.');
  return folders.next();
}

function validId_(id) {
  return typeof id === 'string' && /^[\w-]{10,120}$/.test(id);
}

function ownedFile_(folder, id) {
  if (!validId_(id)) throw new Error('الملف غير موجود.');
  const file = DriveApp.getFileById(id);
  const parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === folder.getId() && !file.isTrashed()) return file;
  }
  throw new Error('الملف غير موجود.');
}

function record_(file) {
  return Object.assign(JSON.parse(file.getBlob().getDataAsString('UTF-8')), {id: file.getId()});
}

function records_(folder) {
  const files = folder.getFilesByType('application/json');
  const result = [];
  while (files.hasNext()) result.push(record_(files.next()));
  return result;
}

function imageData_(file) {
  if (!IMAGE_MIME_.includes(file.getMimeType()) || file.getSize() > MAX_IMAGE_) {
    throw new Error('صيغة الصورة أو حجمها غير مدعوم.');
  }
  return 'data:' + file.getMimeType() + ';base64,' + Utilities.base64Encode(file.getBlob().getBytes());
}

function sortItems_(items) {
  return items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ar') || a.id.localeCompare(b.id));
}

function normalizeSearch_(text) {
  return text.toLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي');
}
