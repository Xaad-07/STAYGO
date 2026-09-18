import { Link } from "react-router-dom";

// Public About page. Per spec: no fake corporate history, just a clear
// explanation of what StayGo is and how it works.
export default function About() {
  const steps = [
    { title: "Search", text: "Tell us where you're going, your dates and how many guests." },
    { title: "Choose", text: "Compare properties by price, type, rating and amenities." },
    { title: "Book", text: "Reserve your stay and add pickup assistance if you need it." },
    { title: "Stay", text: "Enjoy your trip, then leave a review to help other travelers." },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <h1>Travel better with StayGo</h1>
      <p style={{ color: "var(--color-text-light)", fontSize: 16 }}>
        Find • Book • Stay
      </p>

      <h2>What is StayGo?</h2>
      <p>
        StayGo is a property discovery and booking platform. It connects travelers
        with hosts offering apartments, villas, hotels, resorts, homestays and
        cottages, and makes it simple to search, compare, and book a place to stay
        — with optional pickup and drop assistance for a smoother trip.
      </p>

      <h2>How StayGo Works</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, margin: "16px 0" }}>
        {steps.map((s, i) => (
          <div key={s.title} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: 16 }}>
            <div style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 700 }}>{i + 1}. {s.title}</div>
            <p style={{ fontSize: 13, marginTop: 6 }}>{s.text}</p>
          </div>
        ))}
      </div>

      <h2>Why Choose StayGo?</h2>
      <ul>
        <li>Straightforward search and booking, without unnecessary steps.</li>
        <li>Property details, pricing and availability drawn directly from our database.</li>
        <li>Optional pickup and drop assistance for added convenience.</li>
        <li>Secure accounts protected with modern password hashing.</li>
      </ul>

      <Link to="/properties" className="btn btn-primary" style={{ maxWidth: 220, marginTop: 20 }}>
        Explore Properties
      </Link>
    </div>
  );
}
