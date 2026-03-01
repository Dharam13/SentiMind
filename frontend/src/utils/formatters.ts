export function formatDateTime(input: string | number | Date) {
  const d = input instanceof Date ? input : new Date(input);
  return d.toLocaleString();
}

