import { ImageResponse } from "next/og";

// Default link preview for any page without its own image
export const alt = "HV Prop Shop · Prop & set dressing rentals, Hudson Valley to NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#fafafa",
          color: "#171717",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 14,
              background: "#171717",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            HV
          </div>
          <div style={{ fontSize: 40, fontWeight: 600 }}>Prop Shop</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, maxWidth: 950 }}>
            Props and set dressing for film, TV and photo.
          </div>
          <div style={{ fontSize: 32, color: "#525252" }}>
            Rent from independent vendors, Hudson Valley to New York City.
          </div>
        </div>
        <div style={{ display: "flex", height: 10, width: 160, background: "#1f4d3a", borderRadius: 5 }} />
      </div>
    ),
    size
  );
}
