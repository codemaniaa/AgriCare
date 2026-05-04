import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  FiPhone, FiMail, FiMapPin, FiMessageCircle, FiChevronLeft, FiChevronRight,
  FiPackage, FiArrowLeft, FiShare2, FiUser, FiShoppingBag
} from "react-icons/fi";
import { HiOutlineLocationMarker, HiOutlineBadgeCheck } from "react-icons/hi";

/* ---------- Design tokens (match ProductDetailPage) ---------- */
const T = {
  green: "#16734a",
  greenDark: "#0f5235",
  greenSoft: "#e8f5ee",
  bg: "#f6fbf8",
  card: "#ffffff",
  border: "#dbeede",
  text: "#0f2418",
  sub: "#5d7a66",
  shadow: "0 6px 24px rgba(16,64,38,0.08)",
  shadowLg: "0 14px 40px rgba(16,64,38,0.14)",
  fontHead: "'Clash Display','Inter',sans-serif",
  fontBody: "'Inter','Sora',sans-serif",
  fontUI: "'Sora','Inter',sans-serif",
};

/* ---------- Inject fonts + global styles once ---------- */
function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById("pp-global-styles")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);

    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href = "https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap";
    document.head.appendChild(link2);

    const style = document.createElement("style");
    style.id = "pp-global-styles";
    style.innerHTML = `
      @keyframes pp-fade-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      .pp-fade { animation: pp-fade-up .5s ease both; }
      .pp-btn { transition: transform .2s ease, box-shadow .2s ease, background .2s ease; }
      .pp-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(22,115,74,.28); }
      .pp-btn:active { transform: translateY(0); }
      .pp-card { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
      .pp-card:hover { transform: translateY(-6px); box-shadow: ${T.shadowLg}; border-color:${T.green}; }
      .pp-arrow { transition: background .2s, transform .2s, opacity .2s; }
      .pp-arrow:hover { background:${T.green}; color:#fff; transform: translateY(-50%) scale(1.08); }
      .pp-img { transition: transform .5s ease; }
      .pp-card:hover .pp-img { transform: scale(1.07); }
      .pp-dot { transition: width .25s ease, background .25s ease; }
    `;
    document.head.appendChild(style);
  }, []);
}

/* ---------- Image slider for product cards ---------- */
function CardSlider({ images, alt }) {
  const [i, setI] = useState(0);
  const valid = (images || []).filter(Boolean);
  if (valid.length === 0) {
    return (
      <div style={{
        height: 180, background: T.greenSoft, display: "flex",
        alignItems: "center", justifyContent: "center", color: T.sub, fontFamily: T.fontUI, fontSize: 13
      }}>
        <FiPackage size={28} />
      </div>
    );
  }
  const prev = (e) => { e.preventDefault(); e.stopPropagation(); setI((i - 1 + valid.length) % valid.length); };
  const next = (e) => { e.preventDefault(); e.stopPropagation(); setI((i + 1) % valid.length); };

  return (
    <div style={{ position: "relative", height: 180, overflow: "hidden", background: T.greenSoft }}>
      <img
        src={valid[i]}
        alt={alt}
        className="pp-img"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {valid.length > 1 && (
        <>
          <button onClick={prev} className="pp-arrow" aria-label="Previous"
            style={arrowStyle("left")}><FiChevronLeft size={18} /></button>
          <button onClick={next} className="pp-arrow" aria-label="Next"
            style={arrowStyle("right")}><FiChevronRight size={18} /></button>
          <div style={{
            position: "absolute", bottom: 8, left: 0, right: 0,
            display: "flex", justifyContent: "center", gap: 5
          }}>
            {valid.map((_, idx) => (
              <span key={idx} className="pp-dot" style={{
                height: 6, width: idx === i ? 18 : 6, borderRadius: 99,
                background: idx === i ? "#fff" : "rgba(255,255,255,.55)"
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
const arrowStyle = (side) => ({
  position: "absolute", top: "50%", [side]: 8, transform: "translateY(-50%)",
  width: 32, height: 32, borderRadius: "50%", border: "none",
  background: "rgba(255,255,255,.92)", color: T.greenDark,
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,.15)"
});

/* ---------- Main page ---------- */
export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useGlobalStyles();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/auth/profile/${username}/`)
      .then(r => r.json())
      .then(res => { setData(res); setLoading(false); })
      .catch(() => setLoading(false));
  }, [username]);

  const handleChat = () => {
    if (!data) return;
    navigate(`/chat?user=${data.username}`);
  };

  if (loading) {
    return (
      <div style={shellStyle}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
          <div style={{ ...skeletonBar, height: 180 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16, marginTop: 24 }}>
            {[...Array(6)].map((_, i) => <div key={i} style={{ ...skeletonBar, height: 240 }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ ...shellStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: T.fontBody }}>
          <FiUser size={48} color={T.sub} />
          <h2 style={{ fontFamily: T.fontHead, color: T.text, margin: "12px 0 4px" }}>Profile not found</h2>
          <p style={{ color: T.sub }}>The seller you’re looking for doesn’t exist.</p>
        </div>
      </div>
    );
  }

  const products = data.products || [];

  return (
    <div style={shellStyle}>
      {/* Top bar */}
      <div style={{
        background: "#fff", borderBottom: `1px solid ${T.border}`,
        position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(6px)"
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
        }}>
          <button onClick={() => navigate(-1)} className="pp-btn" style={iconBtn}>
            <FiArrowLeft size={18} />
          </button>
          <h1 style={{
            margin: 0, fontFamily: T.fontHead, fontSize: 18, color: T.text, letterSpacing: -.3
          }}>Seller Profile</h1>
          <button className="pp-btn" style={iconBtn} onClick={() => navigator.share?.({ url: window.location.href })}>
            <FiShare2 size={18} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 48px" }}>

        {/* HERO PROFILE CARD */}
        <div className="pp-fade" style={{
          position: "relative",
          background: `linear-gradient(135deg, ${T.green} 0%, ${T.greenDark} 100%)`,
          borderRadius: 22, padding: "28px 24px 24px", color: "#fff",
          boxShadow: T.shadowLg, overflow: "hidden"
        }}>
          {/* decorative blobs */}
          <div style={blob(-40, -40, 180, "rgba(255,255,255,.08)")} />
          <div style={blob("auto", -60, 220, "rgba(255,255,255,.06)", "right")} />

          <div style={{
            position: "relative", display: "flex", flexWrap: "wrap",
            alignItems: "center", gap: 22
          }}>
            {/* Avatar */}
            <div style={{
              width: 110, height: 110, borderRadius: "50%",
              background: "#fff", padding: 4, flexShrink: 0,
              boxShadow: "0 10px 30px rgba(0,0,0,.2)"
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: T.greenSoft, color: T.greenDark, overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontHead, fontSize: 38, fontWeight: 700
              }}>
                {data.profile_picture
                  ? <img src={data.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : data.username?.[0]?.toUpperCase()}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 style={{
                  margin: 0, fontFamily: T.fontHead, fontSize: 28,
                  letterSpacing: -.5, fontWeight: 700
                }}>{data.username}</h2>
                <HiOutlineBadgeCheck size={22} color="#a8f0c6" />
              </div>
              {data.city && (
                <div style={{
                  marginTop: 4, display: "flex", alignItems: "center", gap: 6,
                  fontFamily: T.fontBody, fontSize: 14, opacity: .9
                }}>
                  <HiOutlineLocationMarker size={16} /> {data.city}
                </div>
              )}

              <div style={{
                marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8,
                fontFamily: T.fontUI, fontSize: 13
              }}>
                {data.phone && <Chip icon={<FiPhone size={13} />} text={data.phone} />}
                {data.email && <Chip icon={<FiMail size={13} />} text={data.email} />}
                {data.address && <Chip icon={<FiMapPin size={13} />} text={data.address} />}
              </div>
            </div>

            {/* CTA */}
            <button onClick={handleChat} className="pp-btn" style={{
              background: "#fff", color: T.greenDark, border: "none",
              padding: "12px 22px", borderRadius: 12, cursor: "pointer",
              fontFamily: T.fontUI, fontWeight: 600, fontSize: 15,
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 8px 20px rgba(0,0,0,.18)"
            }}>
              <FiMessageCircle size={18} /> Message
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            position: "relative", marginTop: 22, display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10
          }}>
            <Stat label="Listings" value={products.length} icon={<FiShoppingBag size={16} />} />
            <Stat label="Location" value={data.city || "—"} icon={<HiOutlineLocationMarker size={16} />} />
            <Stat label="Status" value="Active" icon={<HiOutlineBadgeCheck size={16} />} />
          </div>
        </div>

        {/* LISTINGS HEADER */}
        <div style={{
          marginTop: 36, marginBottom: 14,
          display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12
        }}>
          <h3 style={{
            margin: 0, fontFamily: T.fontHead, fontSize: 22, color: T.text, letterSpacing: -.3
          }}>
            Listings
            <span style={{
              marginLeft: 10, fontFamily: T.fontUI, fontSize: 13,
              color: T.greenDark, background: T.greenSoft,
              padding: "3px 10px", borderRadius: 99, fontWeight: 600
            }}>{products.length}</span>
          </h3>
          <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.sub }}>
            From {data.username}
          </span>
        </div>

        {/* PRODUCTS GRID */}
        {products.length === 0 ? (
          <div style={{
            background: "#fff", border: `1px dashed ${T.border}`, borderRadius: 16,
            padding: 48, textAlign: "center", color: T.sub, fontFamily: T.fontBody
          }}>
            <FiPackage size={36} style={{ marginBottom: 8 }} />
            <div>No listings yet.</div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))",
            gap: 18
          }}>
            {products.map((p, idx) => {
              const imgs = p.images?.length ? p.images.map(x => x.image || x) : (p.image ? [p.image] : []);
              return (
                <Link to={`/product/${p.id}`} key={p.id}
                  className="pp-card pp-fade"
                  style={{
                    textDecoration: "none", color: "inherit",
                    background: "#fff", border: `1px solid ${T.border}`,
                    borderRadius: 16, overflow: "hidden", display: "block",
                    boxShadow: T.shadow, animationDelay: `${idx * 40}ms`
                  }}>
                  <CardSlider images={imgs} alt={p.title} />
                  <div style={{ padding: "14px 14px 16px" }}>
                    <h4 style={{
                      margin: 0, fontFamily: T.fontHead, fontSize: 15,
                      color: T.text, lineHeight: 1.3,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 40
                    }}>{p.title}</h4>

                    {p.city && (
                      <div style={{
                        marginTop: 6, fontSize: 12, color: T.sub, fontFamily: T.fontBody,
                        display: "flex", alignItems: "center", gap: 4
                      }}>
                        <HiOutlineLocationMarker size={12} /> {p.city}
                      </div>
                    )}

                    <div style={{
                      marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between"
                    }}>
                      <div style={{
                        fontFamily: T.fontUI, fontWeight: 700, fontSize: 16, color: T.greenDark
                      }}>
                        Rs {Number(p.price).toLocaleString()}
                      </div>
                      <span style={{
                        fontFamily: T.fontUI, fontSize: 11, fontWeight: 600,
                        color: T.greenDark, background: T.greenSoft,
                        padding: "4px 10px", borderRadius: 99
                      }}>View</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Small bits ---------- */
const shellStyle = {
  background: T.bg, minHeight: "100vh", fontFamily: T.fontBody, color: T.text
};
const iconBtn = {
  width: 38, height: 38, borderRadius: 10, border: `1px solid ${T.border}`,
  background: "#fff", color: T.text, cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center"
};
const skeletonBar = {
  background: "linear-gradient(90deg,#eef6f0,#f7fbf8,#eef6f0)",
  backgroundSize: "200% 100%", animation: "pp-shimmer 1.4s infinite",
  borderRadius: 14
};
function Chip({ icon, text }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.25)",
      padding: "6px 10px", borderRadius: 99, color: "#fff", backdropFilter: "blur(4px)"
    }}>{icon}{text}</span>
  );
}
function Stat({ label, value, icon }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.18)",
      borderRadius: 12, padding: "10px 12px", color: "#fff", fontFamily: T.fontUI
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: .85 }}>
        {icon}{label}
      </div>
      <div style={{ marginTop: 2, fontSize: 16, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
function blob(top, left, size, color, side = "left") {
  return {
    position: "absolute", top, [side]: left, width: size, height: size,
    borderRadius: "50%", background: color, filter: "blur(10px)", pointerEvents: "none"
  };
}
