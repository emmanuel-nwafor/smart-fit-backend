// app/api/exercises/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Fetching all exercises...");

    const exercisesRef = collection(db, "exercises");
    const q = query(exercisesRef, orderBy("createdAt", "desc")); // Newest first
    const snapshot = await getDocs(q);

    const exercises = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Successfully fetched ${exercises.length} exercises`);

    return NextResponse.json(
      {
        success: true,
        count: exercises.length,
        exercises,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching exercises:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load exercises. Please try again.",
      },
      { status: 500 }
    );
  }
}