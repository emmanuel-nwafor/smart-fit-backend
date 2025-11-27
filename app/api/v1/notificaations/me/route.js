// /api/v1/notifications/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Get token from headers
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { userId } = decoded;

    // Reference to notifications subcollection
    const notifRef = collection(db, "users", userId, "notifications");
    const notifSnap = await getDocs(notifRef);

    const notifications = notifSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        read: data.read || false,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
      };
    });

    // Sort newest first
    notifications.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt) : 0;
      const bTime = b.createdAt ? new Date(b.createdAt) : 0;
      return bTime - aTime;
    });

    return NextResponse.json(
      {
        success: true,
        count: notifications.length,
        notifications,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("NOTIFICATIONS GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
