import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
  try {
    // Parse body safely
    let body = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { title, message } = body;
    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "Title and message are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Sending notification:", { title, message });

    // Save to Firestore
    await addDoc(collection(db, "notifications"), {
      title,
      message,
      read: false,
      createdAt: serverTimestamp(),
    });

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent to all users." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("SEND NOTIFICATION ERROR:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
