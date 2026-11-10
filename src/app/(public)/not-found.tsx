import NotFoundContent from "@/components/NotFoundContent";

// notFound() inside public pages (missing item, vendor, category or town) — keeps the site header/footer
export default function PublicNotFound() {
  return <NotFoundContent />;
}
