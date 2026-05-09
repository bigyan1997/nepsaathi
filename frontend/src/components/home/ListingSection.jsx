import { Link } from "react-router-dom";
import { SkeletonHomeRow, SkeletonDesktopCard } from "../ui/Skeleton";

export default function ListingSection({ title, viewAllTo, viewAllColor, items, renderRow, renderCard, isLoading }) {
  if (!isLoading && !items?.length) return null;
  return (
    <div className="home-section" style={{ padding: "0 28px 32px", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#26215C", margin: 0 }}>{title}</h2>
        <Link to={viewAllTo} style={{ fontSize: "13px", color: viewAllColor, textDecoration: "none", fontWeight: 500 }}>
          View all →
        </Link>
      </div>

      {isLoading ? (
        <>
          <div className="listing-mobile" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3, 4].map((i) => <SkeletonHomeRow key={i} />)}
          </div>
          <div className="listing-desktop" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonDesktopCard key={i} />)}
          </div>
        </>
      ) : (
        <>
          <div className="listing-mobile" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map((item) => renderRow(item))}
          </div>
          <div className="listing-desktop" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {items.map((item) => renderCard(item))}
          </div>
        </>
      )}
    </div>
  );
}
