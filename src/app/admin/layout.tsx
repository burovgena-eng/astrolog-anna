import type { Metadata } from "next";

/**
 * Task 23: служебная админ-панель — закрыта от индексации.
 * (Сама страница — клиентский компонент, поэтому метаданные живёт здесь.)
 */
export const metadata: Metadata = {
  title: "Админ-панель",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
