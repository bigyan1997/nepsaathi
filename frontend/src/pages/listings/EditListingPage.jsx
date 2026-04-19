import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getListing, updateListing } from "../../api/listings";
import { getJobByListing, updateJob } from "../../api/jobs";
import { getRoomByListing, updateRoom } from "../../api/rooms";
import { getEventByListing, updateEvent } from "../../api/events";
import {
  getAnnouncementByListing,
  updateAnnouncement,
} from "../../api/announcements";
import usePageTitle from "../../hooks/usePageTitle";
import { useToast } from "../../components/ui/Toast";

const inputStyle = {
  width: "100%",
  border: "0.5px solid #ccc",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  background: "#fff",
  color: "#333",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: 500,
  color: "#444",
  display: "block",
  marginBottom: "6px",
};

const STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];

export default function EditListingPage() {
  usePageTitle("Edit Listing");
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [baseForm, setBaseForm] = useState({
    title: "",
    description: "",
    location: "",
    state: "NSW",
    contact_email: "",
    contact_phone: "",
    contact_whatsapp: "",
  });
  const [typeForm, setTypeForm] = useState({});
  const [listingType, setListingType] = useState("");
  const [typeId, setTypeId] = useState(null);

  // Fetch base listing
  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing(id),
  });

  // Fetch type-specific details
  const { data: typeData } = useQuery({
    queryKey: ["listing-type-detail", id, listingType],
    queryFn: () => {
      if (listingType === "job") return getJobByListing(id);
      if (listingType === "room") return getRoomByListing(id);
      if (listingType === "event") return getEventByListing(id);
      if (listingType === "announcement") return getAnnouncementByListing(id);
      return null;
    },
    enabled: !!listingType,
  });

  // Populate base form
  useEffect(() => {
    if (listing) {
      // Redirect if not owner
      if (!listing.is_owner) {
        navigate("/");
        return;
      }
      setListingType(listing.listing_type);
      setBaseForm({
        title: listing.title || "",
        description: listing.description || "",
        location: listing.location || "",
        state: listing.state || "NSW",
        contact_email: listing.contact_email || "",
        contact_phone: listing.contact_phone || "",
        contact_whatsapp: listing.contact_whatsapp || "",
      });
    }
  }, [listing]);

  // Populate type-specific form
  useEffect(() => {
    if (typeData) {
      setTypeId(typeData.id);
      if (listingType === "job") {
        setTypeForm({
          company_name: typeData.company_name || "",
          job_type: typeData.job_type || "casual",
          salary: typeData.salary || "",
          salary_type: typeData.salary_type || "hourly",
          experience_required: typeData.experience_required || "",
          qualifications: typeData.qualifications || "",
          is_urgent: typeData.is_urgent || false,
        });
      } else if (listingType === "room") {
        setTypeForm({
          room_type: typeData.room_type || "private",
          price: typeData.price || "",
          furnishing: typeData.furnishing || "furnished",
          bond: typeData.bond || "4_weeks",
          bills_included: typeData.bills_included || false,
          available_from: typeData.available_from || "",
          bedrooms: typeData.bedrooms || 1,
          bathrooms: typeData.bathrooms || 1,
          max_occupants: typeData.max_occupants || 1,
          nepalese_household: typeData.nepalese_household || false,
          pets_allowed: typeData.pets_allowed || false,
          parking_available: typeData.parking_available || false,
        });
      } else if (listingType === "event") {
        setTypeForm({
          category: typeData.category || "community",
          event_date: typeData.event_date?.slice(0, 16) || "",
          event_end_date: typeData.event_end_date?.slice(0, 16) || "",
          venue: typeData.venue || "",
          organiser: typeData.organiser || "",
          is_free: typeData.is_free || false,
          ticket_price: typeData.ticket_price || "",
          max_attendees: typeData.max_attendees || "",
          is_online: typeData.is_online || false,
          event_url: typeData.event_url || "",
        });
      } else if (listingType === "announcement") {
        setTypeForm({
          category: typeData.category || "general",
          price: typeData.price || "",
          condition: typeData.condition || "na",
          is_free: typeData.is_free || false,
          is_urgent: typeData.is_urgent || false,
        });
      }
    }
  }, [typeData, listingType]);

  const handleSubmit = async () => {
    if (!baseForm.title || !baseForm.description || !baseForm.location) {
      setError("Please fill in title, description and location.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!typeId) {
        setError("Please wait for the listing details to load before saving.");
        setLoading(false);
        return;
      }
      await updateListing(id, baseForm);
      if (listingType === "job") await updateJob(typeId, typeForm);
      else if (listingType === "room")
        await updateRoom(typeId, { ...typeForm, price: typeForm.price });
      else if (listingType === "event")
        await updateEvent(typeId, {
          ...typeForm,
          ticket_price: typeForm.ticket_price || null,
          max_attendees: typeForm.max_attendees || null,
        });
      else if (listingType === "announcement")
        await updateAnnouncement(typeId, {
          ...typeForm,
          price: typeForm.price || null,
        });

      queryClient.invalidateQueries(["my-listings"]);
      queryClient.invalidateQueries(["jobs"]);
      queryClient.invalidateQueries(["rooms"]);
      queryClient.invalidateQueries(["events"]);
      queryClient.invalidateQueries(["announcements"]);

      addToast("Listing updated successfully!", "success");
      navigate(`/${listingType}s/listing/${id}`);
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const firstError = Object.values(errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
        Loading listing...
      </div>
    );

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto", padding: "28px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#26215C",
            marginBottom: "6px",
          }}
        >
          Edit listing
        </h1>
        <p style={{ fontSize: "13px", color: "#888" }}>
          Update your {listingType} listing
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: "14px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
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

        <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#26215C" }}>
          Basic details
        </h2>

        <div>
          <label style={labelStyle}>Title *</label>
          <input
            style={inputStyle}
            value={baseForm.title}
            onChange={(e) =>
              setBaseForm({ ...baseForm, title: e.target.value })
            }
          />
        </div>

        <div>
          <label style={labelStyle}>Description *</label>
          <textarea
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
            value={baseForm.description}
            onChange={(e) =>
              setBaseForm({ ...baseForm, description: e.target.value })
            }
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Suburb / City *</label>
            <input
              style={inputStyle}
              value={baseForm.location}
              onChange={(e) =>
                setBaseForm({ ...baseForm, location: e.target.value })
              }
            />
          </div>
          <div>
            <label style={labelStyle}>State *</label>
            <select
              style={inputStyle}
              value={baseForm.state}
              onChange={(e) =>
                setBaseForm({ ...baseForm, state: e.target.value })
              }
            >
              {STATES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Contact phone</label>
          <input
            style={inputStyle}
            value={baseForm.contact_phone}
            onChange={(e) =>
              setBaseForm({ ...baseForm, contact_phone: e.target.value })
            }
          />
        </div>

        <div>
          <label style={labelStyle}>WhatsApp</label>
          <input
            style={inputStyle}
            value={baseForm.contact_whatsapp}
            onChange={(e) =>
              setBaseForm({ ...baseForm, contact_whatsapp: e.target.value })
            }
          />
        </div>

        <div>
          <label style={labelStyle}>Contact email</label>
          <input
            type="email"
            style={inputStyle}
            value={baseForm.contact_email}
            onChange={(e) =>
              setBaseForm({ ...baseForm, contact_email: e.target.value })
            }
          />
        </div>

        {/* Job specific fields */}
        {listingType === "job" && (
          <>
            <hr style={{ border: "none", borderTop: "0.5px solid #e5e5e5" }} />
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#26215C" }}>
              Job details
            </h2>
            <div>
              <label style={labelStyle}>Company name</label>
              <input
                style={inputStyle}
                value={typeForm.company_name || ""}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, company_name: e.target.value })
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Job type</label>
                <select
                  style={inputStyle}
                  value={typeForm.job_type || "casual"}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, job_type: e.target.value })
                  }
                >
                  {[
                    { value: "full_time", label: "Full time" },
                    { value: "part_time", label: "Part time" },
                    { value: "casual", label: "Casual" },
                    { value: "contract", label: "Contract" },
                  ].map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Salary (AUD)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={typeForm.salary || ""}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, salary: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Experience required</label>
              <input
                style={inputStyle}
                value={typeForm.experience_required || ""}
                onChange={(e) =>
                  setTypeForm({
                    ...typeForm,
                    experience_required: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Qualifications</label>
              <textarea
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                value={typeForm.qualifications || ""}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, qualifications: e.target.value })
                }
              />
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#444",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={typeForm.is_urgent || false}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, is_urgent: e.target.checked })
                }
              />
              Mark as urgent
            </label>
          </>
        )}

        {/* Room specific fields */}
        {listingType === "room" && (
          <>
            <hr style={{ border: "none", borderTop: "0.5px solid #e5e5e5" }} />
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#26215C" }}>
              Room details
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Room type</label>
                <select
                  style={inputStyle}
                  value={typeForm.room_type || "private"}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, room_type: e.target.value })
                  }
                >
                  {[
                    { value: "private", label: "Private" },
                    { value: "shared", label: "Shared" },
                    { value: "entire", label: "Entire" },
                    { value: "studio", label: "Studio" },
                  ].map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Weekly rent (AUD)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={typeForm.price || ""}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, price: e.target.value })
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Bedrooms</label>
                <input
                  type="number"
                  min="1"
                  style={inputStyle}
                  value={typeForm.bedrooms || 1}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, bedrooms: e.target.value })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Bathrooms</label>
                <input
                  type="number"
                  min="1"
                  style={inputStyle}
                  value={typeForm.bathrooms || 1}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, bathrooms: e.target.value })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Max occupants</label>
                <input
                  type="number"
                  min="1"
                  style={inputStyle}
                  value={typeForm.max_occupants || 1}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, max_occupants: e.target.value })
                  }
                />
              </div>
            </div>
            {[
              { key: "bills_included", label: "Bills included" },
              { key: "nepalese_household", label: "🇳🇵 Nepalese household" },
              { key: "pets_allowed", label: "Pets allowed" },
              { key: "parking_available", label: "Parking available" },
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#444",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={typeForm[key] || false}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, [key]: e.target.checked })
                  }
                />
                {label}
              </label>
            ))}
          </>
        )}

        {/* Event specific fields */}
        {listingType === "event" && (
          <>
            <hr style={{ border: "none", borderTop: "0.5px solid #e5e5e5" }} />
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#26215C" }}>
              Event details
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Event date & time</label>
                <input
                  type="datetime-local"
                  style={inputStyle}
                  value={typeForm.event_date || ""}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, event_date: e.target.value })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>End date & time</label>
                <input
                  type="datetime-local"
                  style={inputStyle}
                  value={typeForm.event_end_date || ""}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, event_end_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Venue</label>
              <input
                style={inputStyle}
                value={typeForm.venue || ""}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, venue: e.target.value })
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Organiser</label>
              <input
                style={inputStyle}
                value={typeForm.organiser || ""}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, organiser: e.target.value })
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Ticket price (AUD)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={typeForm.ticket_price || ""}
                  disabled={typeForm.is_free}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, ticket_price: e.target.value })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Max attendees</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={typeForm.max_attendees || ""}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, max_attendees: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Event URL</label>
              <input
                type="url"
                style={inputStyle}
                value={typeForm.event_url || ""}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, event_url: e.target.value })
                }
              />
            </div>
            {[
              { key: "is_free", label: "Free event" },
              { key: "is_online", label: "Online event" },
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#444",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={typeForm[key] || false}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, [key]: e.target.checked })
                  }
                />
                {label}
              </label>
            ))}
          </>
        )}

        {/* Announcement specific fields */}
        {listingType === "announcement" && (
          <>
            <hr style={{ border: "none", borderTop: "0.5px solid #e5e5e5" }} />
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#26215C" }}>
              Announcement details
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  style={inputStyle}
                  value={typeForm.category || "general"}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, category: e.target.value })
                  }
                >
                  {[
                    { value: "news", label: "Community news" },
                    { value: "sale", label: "Item for sale" },
                    { value: "service", label: "Service offered" },
                    { value: "lost_found", label: "Lost & found" },
                    { value: "education", label: "Education" },
                    { value: "general", label: "General" },
                  ].map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Price (AUD)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={typeForm.price || ""}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, price: e.target.value })
                  }
                />
              </div>
            </div>
            {[
              { key: "is_free", label: "Free" },
              { key: "is_urgent", label: "Urgent" },
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#444",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={typeForm[key] || false}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, [key]: e.target.checked })
                  }
                />
                {label}
              </label>
            ))}
          </>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            onClick={() => navigate(-1)}
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
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !typeId}
            style={{
              flex: 2,
              background: loading ? "#ccc" : "#534AB7",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : "Save changes →"}
          </button>
        </div>
      </div>
    </div>
  );
}
