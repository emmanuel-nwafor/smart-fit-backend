import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token missing." },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token." },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token payload." },
        { status: 400 }
      );
    }

    // Fetch user profile from Firestore
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 }
      );
    }

    const data = userSnap.data();

    // Added more fields to profile response.
    const profile = {
      id: userSnap.id,
      name: data.name || "",
      email: data.email || "",
      avatar: data.avatar || null,
      bio: data.bio || "",
      workoutsCompleted: data.workoutsCompleted || 0,
      distance: data.distance || 0,
      weeklyAvg: data.weeklyAvg || "0h",
      role: data.role || decoded.role || "user",
      profileCompleted: data.profileCompleted ?? decoded.profileCompleted ?? false,
      createdAt: data.createdAt?.toMillis?.() || Date.now(),
    };

    return NextResponse.json({ success: true, profile }, { status: 200 });
  } catch (error) {
    console.error("PROFILE FETCH ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile." },
      { status: 500 }
    );
  }
}
