// app/api/profile-complete/route.js
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  console.log("Profile complete request received");

  try {
    // Check for Authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid token");
      return NextResponse.json(
        { error: "You're not logged in. Please sign in again." },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify JWT token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.log("Invalid or expired token");
      return NextResponse.json(
        { error: "Your session has expired. Please log in again." },
        { status: 401 }
      );
    }

    const userId = decodedToken.userId;
    console.log(`User ${userId} is completing profile`);

    // Parse and validate form data
    const body = await req.json();
    const { age, goal, weight, height, gender, activityLevel } = body;

    if (!age || !goal || !gender) {
      return NextResponse.json(
        { error: "Please fill in all fields to continue" },
        { status: 400 }
      );
    }

    // Save profile to Firestore
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      age: parseInt(age),
      goal: goal.trim(),
      weight: parseFloat(weight),
      height: parseFloat(height),
      gender: gender.trim(),
      activityLevel: activityLevel.trim(),
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
    });

    console.log(`Profile successfully saved for user: ${userId}`);

    // Success!
    return NextResponse.json(
      {
        message: "Your profile is complete! Welcome to Smart Fit!",
        redirect: "/dashboard",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error saving profile:", error);

    return NextResponse.json(
      { error: "Oops! Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}