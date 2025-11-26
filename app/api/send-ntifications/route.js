import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = "admin_2025@gmail.com";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization token missing." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    if (decoded.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized. Only admin can send notifications." }, { status: 403 });
    }

    let body = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { title, message } = body;
    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    console.log("Sending notification:", { title, message });

    await addDoc(collection(db, "notifications"), {
      title,
      message,
      read: false,
      createdAt: serverTimestamp(),
    });

    // ✅ Always return valid JSON and text
    return new Response(JSON.stringify({ success: true, message: "Notification sent to all users." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SEND NOTIFICATION ERROR:", error);
    return new Response(JSON.stringify({ error: "Failed to send notification." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
