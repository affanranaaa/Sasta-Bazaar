import { useEffect, useState } from "react";

export default function PaymentCountdown({ createdAt }) {
  const getRemainingTime = () => {
    if (!createdAt) {
      return null;
    }

    const deadline = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;

    return deadline - Date.now();
  };

  const [remaining, setRemaining] = useState(getRemainingTime);

  useEffect(() => {
    if (!createdAt) {
      setRemaining(null);
      return;
    }

    const deadline = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;

    const updateRemainingTime = () => {
      setRemaining(deadline - Date.now());
    };

    updateRemainingTime();

    const intervalId = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(intervalId);
  }, [createdAt]);

  if (!createdAt || !Number.isFinite(remaining)) {
    return null;
  }

  if (remaining <= 0) {
    return (
      <div className="alert alert-warning mt-3 mb-0">
        The 24-hour payment window has expired. Please refresh your orders to
        see the latest status.
      </div>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");

  return (
    <div className="alert alert-info mt-3 mb-0">
      Time left to pay: <strong>{formattedTime}</strong>
    </div>
  );
}
