import { permanentRedirect } from "next/navigation";

/** /rentals on its own → all inventory */
export default function RentalsIndex() {
  permanentRedirect("/");
}
