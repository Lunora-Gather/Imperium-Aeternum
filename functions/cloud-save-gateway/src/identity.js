function shortHash(value) {
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    a = Math.imul(a ^ value.charCodeAt(index), 0x01000193);
    b = Math.imul(b ^ value.charCodeAt(index), 0x85ebca6b);
  }
  return `${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`;
}

export function buildCloudSaveRowId(userId, slot) {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 14) || 'user';
  return `save_${safe}_${shortHash(userId).slice(0, 12)}_${slot}`;
}
