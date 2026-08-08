import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { createBusiness, uploadBusinessImages } from "../../api/businesses";
import usePageTitle from "../../hooks/usePageTitle";
import { useToast } from "../../components/ui/Toast";
import { STATES } from "../../utils/constants";
import AddressAutocomplete from "../../components/ui/AddressAutocomplete";

const CATEGORIES = [
  { value: "restaurant", label: "🍛 Restaurant & Cafe" },
  { value: "grocery", label: "🛒 Grocery & Food Store" },
  { value: "travel", label: "✈️ Travel & Tourism" },
  { value: "beauty", label: "💇 Beauty & Salon" },
  { value: "health", label: "🏥 Health & Medical" },
  { value: "legal", label: "⚖️ Legal & Accounting" },
  { value: "education", label: "📚 Education & Tutoring" },
  { value: "religious", label: "🙏 Religious Services" },
  { value: "construction", label: "🔨 Construction & Trade" },
  { value: "transport", label: "🚗 Transport & Logistics" },
  { value: "finance", label: "💸 Finance & Money Transfer" },
  { value: "freelancer", label: "🧑‍💻 Freelancer & Pujari" },
  { value: "retail", label: "🏪 Retail & Shopping" },
  { value: "other", label: "📌 Other" },
];

const inputStyle = {
  width: "100%",
  border: "0.5px solid #ddd",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "13px",
  outline: "none",
  background: "#fff",
  color: "#26215C",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#555",
  display: "block",
  marginBottom: "5px",
};

/* ── Section card with coloured header ── */
function Section({ title, accent, accentBg, accentBorder, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: accentBg,
          borderBottom: `0.5px solid ${accentBorder}`,
          padding: "14px 20px",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: accent,
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Two-col grid ── */
function Grid2({ children }) {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
export default function RegisterBusinessPage() {
  usePageTitle("Register Business");
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [createdSlug, setCreatedSlug] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);

  const uploadMutation = useMutation({
    mutationFn: (fd) => uploadBusinessImages(createdSlug, fd),
    onSuccess: () => navigate(`/businesses/${createdSlug}`),
    onError: () => {
      addToast("Upload failed — you can add photos later from your listing.", "error");
      navigate(`/businesses/${createdSlug}`);
    },
  });

  const handlePhotoSelect = (files) => {
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) { setPhotoError("Only image files allowed."); return false; }
      if (f.size > 5 * 1024 * 1024) { setPhotoError("Each image must be under 5MB."); return false; }
      return true;
    });
    if (valid.length + photoFiles.length > 5) { setPhotoError("Maximum 5 photos."); return; }
    setPhotoError("");
    setPhotoFiles((p) => [...p, ...valid]);
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreviews((p) => [...p, { url: e.target.result, id: `${f.name}-${Date.now()}` }]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i) => {
    setPhotoFiles((p) => p.filter((_, idx) => idx !== i));
    setPhotoPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handlePhotoUpload = () => {
    if (!photoFiles.length) { navigate(`/businesses/${createdSlug}`); return; }
    const fd = new FormData();
    photoFiles.forEach((f) => fd.append("images", f));
    uploadMutation.mutate(fd);
  };

  const [form, setForm] = useState({
    business_name: "",
    category: "restaurant",
    description: "",
    is_nepalese_owned: true,
    address: "",
    suburb: "",
    state: "NSW",
    postcode: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    booking_link: "",
    abn: "",
    established_year: "",
    operating_hours: "",
  });

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setCheck = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.checked }));

  const handleSubmit = async () => {
    if (!form.business_name || !form.description || !form.suburb) {
      addToast(
        "Please fill in business name, description and suburb.",
        "error",
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const business = await createBusiness({
        ...form,
        established_year: form.established_year || null,
      });
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["my-businesses"] });
      addToast("Business registered! Now add some photos.", "success");
      setCreatedSlug(business.slug);
      setStep(2);
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const firstError = Object.values(errors)[0];
        const msg = Array.isArray(firstError) ? firstError[0] : firstError;
        setError(msg);
        addToast(msg, "error");
      } else {
        setError("Something went wrong. Please try again.");
        addToast("Something went wrong. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Photo upload ── */
  if (step === 2 && createdSlug) {
    return (
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "28px", background: "#F5F4F0", minHeight: "100vh" }}>
        <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ background: "#26215C", padding: "20px 24px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Add photos</div>
            <div style={{ fontSize: "13px", color: "#AFA9EC" }}>Photos help your business stand out — you can skip this step</div>
          </div>
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handlePhotoSelect(Array.from(e.dataTransfer.files)); }}
              style={{
                border: "1.5px dashed #AFA9EC", borderRadius: "12px", padding: "32px",
                textAlign: "center", cursor: "pointer", background: "#EEEDFE",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#534AB7", marginBottom: "4px" }}>
                Click to upload or drag and drop
              </div>
              <div style={{ fontSize: "12px", color: "#888" }}>PNG, JPG up to 5MB each · Max 5 photos</div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                onChange={(e) => handlePhotoSelect(Array.from(e.target.files))} />
            </div>

            {photoError && (
              <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#A32D2D" }}>
                {photoError}
              </div>
            )}

            {photoPreviews.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "10px" }}>
                {photoPreviews.map((p, i) => (
                  <div key={p.id} style={{ position: "relative" }}>
                    <img src={p.url} alt="" style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px", border: i === 0 ? "2px solid #534AB7" : "0.5px solid #e5e5e5" }} />
                    {i === 0 && (
                      <div style={{ position: "absolute", bottom: "4px", left: "4px", background: "#534AB7", color: "#fff", fontSize: "10px", fontWeight: 500, padding: "2px 6px", borderRadius: "4px" }}>
                        Main photo
                      </div>
                    )}
                    <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => navigate(`/businesses/${createdSlug}`)}
                style={{ flex: 1, background: "#fff", color: "#555", border: "0.5px solid #ccc", borderRadius: "8px", padding: "12px", fontSize: "14px", cursor: "pointer" }}
              >
                Skip for now
              </button>
              <button
                onClick={handlePhotoUpload}
                disabled={uploadMutation.isPending || photoFiles.length === 0}
                style={{
                  flex: 2, background: uploadMutation.isPending || photoFiles.length === 0 ? "#ccc" : "#534AB7",
                  color: "#fff", border: "none", borderRadius: "8px", padding: "12px",
                  fontSize: "14px", fontWeight: 500, cursor: uploadMutation.isPending || photoFiles.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {uploadMutation.isPending ? "Uploading…" : `Upload ${photoFiles.length} photo${photoFiles.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .rb-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rb-grid21 { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
        @media (max-width: 600px) {
          .rb-grid2  { grid-template-columns: 1fr !important; }
          .rb-grid21 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "28px",
          background: "#F5F4F0",
          minHeight: "100vh",
        }}
      >
        {/* ── Dark hero banner ── */}
        <div
          style={{
            background: "#26215C",
            borderRadius: "16px",
            padding: "24px 28px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#AFA9EC",
              letterSpacing: "0.06em",
              marginBottom: "6px",
            }}
          >
            FREE · ALWAYS
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 6px",
            }}
          >
            Register your business
          </h1>
          <p style={{ fontSize: "13px", color: "#AFA9EC", margin: 0 }}>
            List your Nepalese business on NepSaathi — free forever. Your
            listing goes live immediately.
          </p>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div
            style={{
              background: "#FCEBEB",
              border: "0.5px solid #F09595",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#A32D2D",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* ── 1. Basic info ── */}
          <Section
            title="1 · Basic info"
            accent="#26215C"
            accentBg="#EEEDFE"
            accentBorder="#AFA9EC"
          >
            <div>
              <label style={labelStyle}>Business name *</label>
              <input
                style={inputStyle}
                placeholder="e.g. Himalayan Cafe"
                value={form.business_name}
                onChange={set("business_name")}
              />
            </div>

            <div>
              <label style={labelStyle}>Category *</label>
              <select
                style={inputStyle}
                value={form.category}
                onChange={set("category")}
              >
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>About your business *</label>
              <textarea
                style={{
                  ...inputStyle,
                  minHeight: "100px",
                  resize: "vertical",
                }}
                placeholder="Describe what your business offers, your specialties, and why customers should choose you..."
                value={form.description}
                onChange={set("description")}
                maxLength={1000}
              />
              <div
                style={{
                  fontSize: "11px",
                  color: form.description.length > 900 ? "#E87722" : "#ccc",
                  marginTop: "4px",
                  textAlign: "right",
                }}
              >
                {form.description.length}/1000
              </div>
            </div>
          </Section>

          {/* ── 2. Location ── */}
          <Section
            title="2 · Location"
            accent="#3C3489"
            accentBg="#EEEDFE"
            accentBorder="#AFA9EC"
          >
            <div className="rb-grid2">
              <div>
                <label style={labelStyle}>Suburb *</label>
                <AddressAutocomplete
                  value={form.suburb}
                  onChange={(val) => setForm(p => ({ ...p, suburb: val }))}
                  onSelect={({ suburb, state, postcode }) => setForm(p => ({
                    ...p,
                    suburb,
                    ...(state && { state }),
                    ...(postcode && { postcode }),
                  }))}
                  placeholder="e.g. Parramatta"
                  inputStyle={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>State *</label>
                <select
                  style={inputStyle}
                  value={form.state}
                  onChange={set("state")}
                >
                  {STATES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rb-grid21">
              <div>
                <label style={labelStyle}>Street address</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. 123 Church St"
                  value={form.address}
                  onChange={set("address")}
                />
              </div>
              <div>
                <label style={labelStyle}>Postcode</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. 2150"
                  value={form.postcode}
                  onChange={set("postcode")}
                />
              </div>
            </div>
          </Section>

          {/* ── 3. Contact details ── */}
          <Section
            title="3 · Contact details"
            accent="#633806"
            accentBg="#FFF1E0"
            accentBorder="#EFD9C0"
          >
            <div className="rb-grid2">
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. 0412 345 678"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. 0412 345 678"
                  value={form.whatsapp}
                  onChange={set("whatsapp")}
                />
              </div>
            </div>

            <div className="rb-grid2">
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  style={inputStyle}
                  placeholder="e.g. hello@mybusiness.com"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input
                  type="url"
                  style={inputStyle}
                  placeholder="e.g. https://mybusiness.com"
                  value={form.website}
                  onChange={set("website")}
                />
              </div>
              <div>
                <label style={labelStyle}>Booking / Appointment Link <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
                <input
                  type="url"
                  style={inputStyle}
                  placeholder="e.g. https://calendly.com/yourbusiness"
                  value={form.booking_link}
                  onChange={set("booking_link")}
                />
              </div>
            </div>

            <div
              style={{
                background: "#FFF1E0",
                border: "0.5px solid #EFD9C0",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "12px",
                color: "#633806",
                lineHeight: 1.5,
              }}
            >
              💡 Contact details are only shown to logged-in NepSaathi members —
              not to the public.
            </div>
          </Section>

          {/* ── 4. Extra details ── */}
          <Section
            title="4 · Extra details"
            accent="#085041"
            accentBg="#E1F5EE"
            accentBorder="#9FE1CB"
          >
            <div className="rb-grid2">
              <div>
                <label style={labelStyle}>ABN</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. 12 345 678 901"
                  value={form.abn}
                  onChange={set("abn")}
                />
              </div>
              <div>
                <label style={labelStyle}>Year established</label>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="e.g. 2018"
                  value={form.established_year}
                  onChange={set("established_year")}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Operating hours</label>
              <input
                style={inputStyle}
                placeholder="e.g. Mon–Fri 9am–5pm, Sat 10am–3pm"
                value={form.operating_hours}
                onChange={set("operating_hours")}
              />
            </div>

            {/* Nepalese owned — promoted here, more visible */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                background: form.is_nepalese_owned ? "#E1F5EE" : "#F5F4F0",
                border: `0.5px solid ${form.is_nepalese_owned ? "#9FE1CB" : "#e5e5e5"}`,
                borderRadius: "10px",
                padding: "12px 14px",
                transition: "all 0.15s",
              }}
            >
              <input
                type="checkbox"
                checked={form.is_nepalese_owned}
                onChange={setCheck("is_nepalese_owned")}
                style={{
                  width: "16px",
                  height: "16px",
                  flexShrink: 0,
                  accentColor: "#1D9E75",
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#26215C",
                  }}
                >
                  🇳🇵 Nepalese-owned business
                </div>
                <div
                  style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}
                >
                  Tick this to show the Nepalese owned badge on your listing
                </div>
              </div>
            </label>
          </Section>

          {/* ── Submit ── */}
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#ccc" : "#E87722",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "14px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: "12px",
              }}
            >
              {loading ? "Registering..." : "Register business →"}
            </button>
            <p
              style={{
                fontSize: "12px",
                color: "#aaa",
                textAlign: "center",
                margin: 0,
              }}
            >
              Your business goes live immediately. NepSaathi admin may verify it
              after review.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
