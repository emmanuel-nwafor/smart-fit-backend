// app/api/signup/route.js
import { auth, createUserWithEmailAndPassword } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user profile to Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email,
      role: "user",
      status: "active",
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    });

    // Success response
    return NextResponse.json(
      {
        message: "Signup successful",
        uid: user.uid,
        email: user.email,
        redirect: "/login",
        type: "success",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);

    let message = "Signup failed. Please try again.";

    if (error.code === "auth/email-already-in-use") {
      message = "This email is already registered.";
    } else if (error.code === "auth/weak-password") {
      message = "Password should be at least 6 characters.";
    } else if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email.";
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}