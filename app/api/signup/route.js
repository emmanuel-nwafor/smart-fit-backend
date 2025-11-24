// app/api/signup/route.js
import { auth, createUserWithEmailAndPassword } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user data to Firestore (THIS WAS FAILING BEFORE)
    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email,
      role: "user",
      status: "active",
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: "Signup successful",
        uid: user.uid,
        redirect: "/login",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    let message = "Signup failed";
    if (error.code === "auth/email-already-in-use") message = "Email already registered";
    else if (error.code === "auth/weak-password") message = "Password too weak";
    else if (error.code === "auth/invalid-email") message = "Invalid email";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}