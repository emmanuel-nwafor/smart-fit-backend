// app/api/login/route.js
import { auth, signInWithEmailAndPassword } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch user data from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const userData = userSnap.data();

    // Generate JWT token 
    const token = jwt.sign(
      {
        userId: user.uid,
        email: user.email,
        name: userData.name,
        role: userData.role || "user",
        profileCompleted: userData.profileCompleted || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EXPIRES_IN || "7d" }
    );

    const redirectTo = userData.profileCompleted
      ? "/dashboard"
      : "/auth/profile-complete";

    return NextResponse.json(
      {
        message: "Login successful",
        token,
        user: {
          uid: user.uid,
          email: user.email,
          name: userData.name,
          role: userData.role || "user",
          profileCompleted: userData.profileCompleted || false,
        },
        redirect: redirectTo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);

    let message = "Login failed. Please try again.";

    if (error.code === "auth/user-not-found") {
      message = "No account found with this email.";
    } else if (error.code === "auth/wrong-password") {
      message = "Incorrect password.";
    } else if (error.code === "auth/invalid-email") {
      message = "Invalid email address.";
    } else if (error.code === "auth/too-many-requests") {
      message = "Too many attempts. Try again later.";
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}