// app/api/login/route.js
import { auth, signInWithEmailAndPassword } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = "admin_2025@gmail.com";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Firebase Auth login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const userData = userSnap.data();

    // Generate JWT
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

    // Admin override: always go to /admin
    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const redirectTo = isAdmin
      ? "/admin"
      : userData.profileCompleted
      ? "/dashboard"
      : "/auth/profile-complete";

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Login error:", error);

    const errorMessages = {
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/invalid-email": "Invalid email address.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
    };

    const message = errorMessages[error.code] || "Login failed. Please try again.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}