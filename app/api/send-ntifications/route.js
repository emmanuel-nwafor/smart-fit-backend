import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    // 1️⃣ Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization token missing." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ Parse body safely
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

    // 3️⃣ Save to Firestore
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
