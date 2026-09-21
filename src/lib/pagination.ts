// Shared server-side pagination — every list page (merchants, staff,
// tickets, invoices) reads `?page=` the same way and turns it into a
// Supabase `.range(from, to)` call, instead of loading every row like
// the merchants/tickets pages did before this upgrade.

export const DEFAULT_PAGE_SIZE = 20;

export type PageParams = {
  page: number;
  pageSize: number;
  from: number;
  to: number;
};

export function parsePageParams(
  searchParams: Record<string, string | string[] | undefined>,
  pageSize = DEFAULT_PAGE_SIZE,
): PageParams {
  const raw = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

export function pageCount(totalCount: number | null, pageSize = DEFAULT_PAGE_SIZE): number {
  return Math.max(1, Math.ceil((totalCount ?? 0) / pageSize));
}
