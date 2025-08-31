
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

// This endpoint now saves subscriptions to Firestore for persistence.
export async function POST(req: Request) {
  const body = await req.json();
  // Basic validation
  if (!body || !body.subscription || !body.userId) {
    return new Response('Bad Request: Invalid subscription object or missing userId', { status: 400 });
  }

  const { userId, subscription } = body;

  try {
    // Using the subscription endpoint as the document ID to prevent duplicates
    const endpointB64 = btoa(subscription.endpoint);
    const subscriptionRef = doc(db, `pushSubscriptions/${endpointB64}`);
    
    await setDoc(subscriptionRef, {
        userId,
        subscription,
    }, { merge: true });
    
    console.log(`Subscription saved/updated for user: ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving subscription to Firestore:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
