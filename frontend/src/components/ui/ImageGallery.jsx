import { useState } from "react";

export default function ImageGallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const goNext = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const goPrev = () =>
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <>
      {/* Main gallery */}
      <div
        style={{
          marginBottom: "12px",
          borderRadius: "14px",
          overflow: "hidden",
          border: "0.5px solid #e5e5e5",
        }}
      >
        {/* Main image */}
        <div style={{ position: "relative", background: "#F5F4F0" }}>
          <img
            src={images[activeIndex]?.url}
            alt={`Photo ${activeIndex + 1}`}
            onClick={() => setLightboxOpen(true)}
            style={{
              width: "100%",
              height: "280px",
              objectFit: "cover",
              cursor: "pointer",
              display: "block",
            }}
          />

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ‹
              </button>
              <button
                onClick={goNext}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ›
              </button>
            </>
          )}

          {/* Counter */}
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 500,
              padding: "3px 8px",
              borderRadius: "10px",
            }}
          >
            {activeIndex + 1} / {images.length}
          </div>

          {/* Expand icon */}
          <button
            onClick={() => setLightboxOpen(true)}
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            ⛶ View all
          </button>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "6px",
              background: "#fff",
              overflowX: "auto",
            }}
          >
            {images.map((img, index) => (
              <img
                key={img.id}
                src={img.url}
                alt={`Thumbnail ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                style={{
                  width: "60px",
                  height: "50px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  cursor: "pointer",
                  flexShrink: 0,
                  border:
                    activeIndex === index
                      ? "2px solid #534AB7"
                      : "2px solid transparent",
                  opacity: activeIndex === index ? 1 : 0.7,
                  transition: "all 0.15s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                style={{
                  position: "absolute",
                  left: "16px",
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "44px",
                  height: "44px",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                style={{
                  position: "absolute",
                  right: "16px",
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "44px",
                  height: "44px",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ›
              </button>
            </>
          )}

          <img
            src={images[activeIndex]?.url}
            alt={`Photo ${activeIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: "8px",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: "16px",
              color: "#fff",
              fontSize: "13px",
            }}
          >
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
