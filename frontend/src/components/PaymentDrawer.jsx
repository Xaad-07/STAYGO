import { useState } from "react";

// Right-side drawer shown when the customer clicks "Reserve".
// This is ONLY a payment simulation -- no real payment gateway is used,
// per the project spec. On "Pay Now" we just call onConfirm(paymentMethod)
// and let the parent (PropertyDetails) create the actual booking record.
export default function PaymentDrawer({ totalAmount, onClose, onConfirm, submitting }) {
  const [method, setMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [wallet, setWallet] = useState("PayEase Wallet");
  const [error, setError] = useState("");

  function handlePayNow() {
    setError("");

    // Very light simulation-only checks -- this is not a real payment
    // integration, just enough to make the flow feel real for a demo.
    if (method === "UPI" && upiId.trim() === "") {
      setError("Please enter your UPI ID.");
      return;
    }
    if (method === "Card") {
      if (cardNumber.replace(/\s/g, "").length < 12 || cardExpiry === "" || cardCvv.length < 3 || cardHolder.trim() === "") {
        setError("Please fill in all card details.");
        return;
      }
    }

    onConfirm(method);
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="payment-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3 style={{ margin: 0 }}>Payment</h3>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>

        <div className="payment-total-box">
          <div style={{ fontSize: 13, color: "var(--color-text-light)" }}>Total payable</div>
          <div className="payment-total-amount">₹{totalAmount}</div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <label className="form-label">Payment Method</label>
        <div className="payment-method-grid">
          {["UPI", "Card", "Wallet", "Cash"].map((m) => (
            <div
              key={m}
              className={`role-option ${method === m ? "selected" : ""}`}
              onClick={() => setMethod(m)}
            >
              {m === "Cash" ? "Cash on Arrival" : m}
            </div>
          ))}
        </div>

        {method === "UPI" && (
          <div className="form-group">
            <label className="form-label">UPI ID</label>
            <input className="form-input" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" />
          </div>
        )}

        {method === "Card" && (
          <>
            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input className="form-input" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Expiry</label>
                <input className="form-input" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" />
              </div>
              <div className="form-group">
                <label className="form-label">CVV</label>
                <input className="form-input" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" maxLength={4} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Card Holder Name</label>
              <input className="form-input" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Name on card" />
            </div>
          </>
        )}

        {method === "Wallet" && (
          <div className="form-group">
            <label className="form-label">Select Wallet</label>
            <select className="form-input" value={wallet} onChange={(e) => setWallet(e.target.value)}>
              <option>PayEase Wallet</option>
              <option>QuickPay Wallet</option>
              <option>TravelCash Wallet</option>
            </select>
          </div>
        )}

        {method === "Cash" && (
          <p style={{ fontSize: 13, color: "var(--color-text-light)" }}>
            No payment information is required. Pay the host directly on arrival.
          </p>
        )}

        <button className="btn btn-primary" onClick={handlePayNow} disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? "Processing..." : `Pay ₹${totalAmount}`}
        </button>
      </div>
    </div>
  );
}
