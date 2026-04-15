import { useState, useRef } from "react";
import { uploadImages } from "../../api/listings";

export default function ImageUpload({ listingId, onComplete }) {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    // Validate files
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        setError("Each image must be under 5MB.");
        return false;
      }
      return true;
    });

    if (validFiles.length + images.length > 5) {
      setError("Maximum 5 images per listing.");
      return;
    }

    setError("");
    setImages((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      onComplete();
      return;
    }

    setUploading(true);
    setError("");

    try {
      await uploadImages(listingId, images);
      setUploaded(true);
      setTimeout(() => onComplete(), 1000);
    } catch (err) {
      setError("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#26215C" }}>
        Add photos
      </h2>
      <p style={{ fontSize: "13px", color: "#888", marginTop: "-8px" }}>
        Add up to 5 photos to your listing. Good photos get more responses!
      </p>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: "1.5px dashed #AFA9EC",
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          cursor: "pointer",
          background: "#EEEDFE",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#e0deff")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#EEEDFE")}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.background = "#e0deff";
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.background = "#EEEDFE";
          const files = Array.from(e.dataTransfer.files);
          const fakeEvent = { target: { files } };
          handleFileSelect(fakeEvent);
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#534AB7",
            marginBottom: "4px",
          }}
        >
          Click to upload or drag and drop
        </div>
        <div style={{ fontSize: "12px", color: "#888" }}>
          PNG, JPG up to 5MB each · Max 5 photos
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#FCEBEB",
            border: "0.5px solid #F09595",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "13px",
            color: "#A32D2D",
          }}
        >
          {error}
        </div>
      )}

      {/* Image previews */}
      {previews.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "10px",
          }}
        >
          {previews.map((preview, index) => (
            <div key={index} style={{ position: "relative" }}>
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                style={{
                  width: "100%",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border:
                    index === 0 ? "2px solid #534AB7" : "0.5px solid #e5e5e5",
                }}
              />
              {index === 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    left: "4px",
                    background: "#534AB7",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 500,
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  Main photo
                </div>
              )}
              <button
                onClick={() => removeImage(index)}
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  fontSize: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Success */}
      {uploaded && (
        <div
          style={{
            background: "#E1F5EE",
            border: "0.5px solid #9FE1CB",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "13px",
            color: "#085041",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          ✅ Images uploaded successfully! Redirecting...
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onComplete}
          style={{
            flex: 1,
            background: "#fff",
            color: "#555",
            border: "0.5px solid #ccc",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Skip for now
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || images.length === 0}
          style={{
            flex: 2,
            background: uploading || images.length === 0 ? "#ccc" : "#534AB7",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "14px",
            fontWeight: 500,
            cursor:
              uploading || images.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {uploading
            ? "Uploading..."
            : `Upload ${images.length} photo${images.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
