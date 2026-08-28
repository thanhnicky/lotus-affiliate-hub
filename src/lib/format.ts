export function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "CTV"
  );
}
