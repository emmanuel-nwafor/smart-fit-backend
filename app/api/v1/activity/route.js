// /api/v1/activity/route.js
import { db } from "@/lib/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
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

    const body = await req.json();
    const { exerciseId, name, muscleGroup, reps, description, date } = body;

    if (!exerciseId || !name || !muscleGroup || !reps || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const activityRef = collection(db, "users", userId, "activity");
    const docRef = await addDoc(activityRef, {
      exerciseId,
      name,
      muscleGroup,
      reps,
      description,
      date: date ? new Date(date) : new Date(),
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Activity saved successfully",
      id: docRef.id,
    }, { status: 200 });

  } catch (err) {
    console.error("Activity save error:", err);
    return NextResponse.json({ error: "Failed to save activity" }, { status: 500 });
  }
}
