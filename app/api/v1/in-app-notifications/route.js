// app/api/v1/in-app-notifications/fetch/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization");

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

    // Fetch all notifications from Firestore
    const notificationsQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const notificationsSnap = await getDocs(notificationsQuery);

    const notifications = notificationsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || null,
    }));

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("FETCH NOTIFICATIONS ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}
