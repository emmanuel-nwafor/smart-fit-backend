// app/api/exercises/[id]/route.js

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken"; 

const JWT_SECRET = process.env.JWT_SECRET; 

// Fetching exercises by ID from firestore
export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Exercise ID is required." },
      { status: 400 }
    );
  }

  // JWT Verification
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authorization token missing." },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid or expired token." },
      { status: 401 }
    );
  }

  try {
    const docRef = doc(db, "exercises", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Exercise not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      exercise: { id: docSnap.id, ...docSnap.data() },
    });

  } catch (err) {
    console.error("FETCH EXERCISE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch exercise." },
      { status: 500 }
    );
  }
}
