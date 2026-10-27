export function time(minutes: number) {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
}
export function dateTime(value: string) {
  return new Date(value).toLocaleString('zh-TW');
}

export function currentDateLabel() {
  const now = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  const date = new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .replaceAll('/', '-');
  return `${date}（${week}）`;
}
