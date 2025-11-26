// app/api/admin/send-notifications/route.js
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
// email for only admin || only admin email accepted
const ADMIN_EMAIL = "admin_2025@gmail.com";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization token missing." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    // Only admin can send notifications
    if (decoded.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized. Only admin can send notifications." }, { status: 403 });
    }

    const { title, message } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    // Save notification to Firestore
    await addDoc(collection(db, "notifications"), {
      title,
      message,
      read: false,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: "Notification sent to all users." });
  } catch (error) {
    console.error("SEND NOTIFICATION ERROR:", error);
    return NextResponse.json({ error: "Failed to send notification." }, { status: 500 });
  }
}
