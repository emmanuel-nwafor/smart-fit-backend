// app/api/signup/route.js
import { auth, db, createUserWithEmailAndPassword } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
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

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email,
      role: role || "user",
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    let msg = "Signup failed";
    if (error.code === "auth/email-already-in-use") msg = "Email already registered";
    else if (error.code === "auth/weak-password") msg = "Password too weak";
    else if (error.code === "auth/invalid-email") msg = "Invalid email";

    return NextResponse.json({ error: msg }, { status: 400 });
  }
}