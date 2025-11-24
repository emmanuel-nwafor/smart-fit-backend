// /app/api/signup/route.js
import { auth, db } from "../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Add extra info to Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email,
      role: role || "user",
      status: "active",
      createdAt: new Date().toISOString(),
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.uid,
        email: user.email,
        role: role || "user",
        status: "active",
        name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EXPIRES_IN }
    );

    return NextResponse.json({
      message: "Signup successful",
      uid: user.uid,
      email: user.email,
      role: role || "user",
      token,
      redirect: "/dashboard",
    });

  } catch (error) {
    console.error("Signup error:", error);

    let friendlyMessage = "Signup failed";
    if (error.code === "auth/email-already-in-use") {
      friendlyMessage = "This email is already registered.";
    } else if (error.code === "auth/invalid-email") {
      friendlyMessage = "Invalid email address.";
    } else if (error.code === "auth/weak-password") {
      friendlyMessage = "Password is too weak.";
    }

    return NextResponse.json(
      { error: friendlyMessage },
      { status: 400 }
    );
  }
}
