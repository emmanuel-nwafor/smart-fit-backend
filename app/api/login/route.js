import { auth, db } from "../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth"; // <- Import from firebase/auth
import { doc, getDoc } from "firebase/firestore";
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

    // User authentication via firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Checking users existence in DB
    const docRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(docRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const data = userDoc.data();

    // Token generation
    const token = jwt.sign(
      {
        userId: user.uid,
        email: user.email,
        role: data.role || "user",
        status: data.status || "active",
        ...data,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EXPIRES_IN }
    );

    // Token returning and redirect
    return NextResponse.json({
      message: "Login successful",
      uid: user.uid,
      email: user.email,
      role: data.role || "user",
      status: data.status || "active",
      token,
      redirect: "/dashboard",
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 400 }
    );
  }
}
