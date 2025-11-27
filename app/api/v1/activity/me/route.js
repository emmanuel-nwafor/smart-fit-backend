import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
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

    // Retrieving users activities from firestore.
    const activityRef = collection(db, "users", userId, "activity");
    const snapshot = await getDocs(activityRef);

    const activities = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        exerciseId: data.exerciseId || "",
        name: data.name || "",
        muscleGroup: data.muscleGroup || "",
        reps: data.reps || 0,
        description: data.description || "",
        date: data.date?.toDate ? data.date.toDate() : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
      };
    });

    // Sorting
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json(
      {
        success: true,
        count: activities.length,
        activities,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("ACTIVITY FETCH ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load activity" },
      { status: 500 }
    );
  }
}
