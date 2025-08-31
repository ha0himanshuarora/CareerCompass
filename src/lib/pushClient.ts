
"use client";

export async function subscribeToPush(userId: string) {
  if (!userId) {
    console.error("❌ Cannot subscribe without a user ID.");
    return;
  }
  try {
    const reg = await navigator.serviceWorker.ready;

    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // Send subscription and userId to your backend
      await fetch("/api/save-subscription", {
        method: "POST",
        body: JSON.stringify({ subscription, userId }),
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ User subscribed to push notifications");
    } else {
      console.log("ℹ️ User already subscribed");
    }
  } catch (error) {
    console.error("❌ Failed to subscribe to push notifications", error);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
