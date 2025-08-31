
'use server'

import webpush from "web-push";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

let vapidKeysConfigured = false;
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      "mailto:test@example.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    vapidKeysConfigured = true;
} else {
    console.error("VAPID keys not configured. Please check your .env file.");
}


export async function sendNotificationToUser(userId: string, payload: { title: string, body: string }) {
  if (!vapidKeysConfigured) {
      console.error("Cannot send notification: VAPID keys not configured.");
      return { success: false, message: "VAPID keys not configured." };
  }
  
  try {
    // Get subscriptions from Firestore
    const subscriptionsQuery = query(collection(db, "pushSubscriptions"), where("userId", "==", userId));
    const querySnapshot = await getDocs(subscriptionsQuery);
    
    const subscriptions = querySnapshot.docs.map(doc => doc.data().subscription);

    if (subscriptions.length === 0) {
        console.log(`No subscriptions found for user ${userId}.`);
        return { success: true, message: `No subscriptions for user ${userId}.`};
    }

    const notificationPayload = JSON.stringify(payload);
    
    const notificationPromises = subscriptions.map(sub => 
        webpush.sendNotification(sub, notificationPayload)
    );

    await Promise.all(notificationPromises);
    
    return { success: true, message: `Notifications sent to user ${userId}.` };
  } catch (error) {
    console.error("Error sending notification:", error);
    // It's common for subscriptions to become invalid. We should handle those cases.
    // For this example, we'll just log the error.
    return { success: false, message: "Failed to send notification." };
  }
}
