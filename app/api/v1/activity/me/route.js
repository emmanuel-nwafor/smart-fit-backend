import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Get token
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

    // Firestore reference
    const ref = collection(db, "users", userId, "activity");
    const snap = await getDocs(ref);

    const activities = snap.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        exerciseId: data.exerciseId,
        name: data.name,
        muscleGroup: data.muscleGroup,
        reps: data.reps, // String (e.g. "Negative Reps")

        description: data.description,

        // Convert timestamps safely
        date: data.date?.toDate ? data.date.toDate() : null,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
      };
    });

    // Sort by date (newest first)
    activities.sort((a, b) => {
      const aDate = a.date ? new Date(a.date) : 0;
      const bDate = b.date ? new Date(b.date) : 0;
      return bDate - aDate;
    });

    return NextResponse.json(
      {
        success: true,
        count: activities.length,
        activities,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("ACTIVITY GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
