export async function fetchPages<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, current: () => boolean = () => true): Promise<T[]> {
  const rows: T[] = [];
  while (current()) {
    const result = await page(rows.length, rows.length + 499);
    if (result.error) throw result.error;
    if (!result.data?.length) break;
    rows.push(...result.data);
  }
  return rows;
}
