import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { sendConfirmationEmail } from "@/lib/email-service"
import type { User } from "@/lib/db-schema"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, preferences } = body

    if (!email || !name || !preferences) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // First, check if the user exists
    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    if (findError) {
      console.error("Error checking for existing user:", findError)
      return NextResponse.json({ error: "Failed to check for existing user" }, { status: 500 })
    }

    let user: User

    if (existingUser) {
      // User exists, update their preferences
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ preferences })
        .eq("id", existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating user:", updateError)
        return NextResponse.json({ error: "Failed to update user preferences" }, { status: 500 })
      }

      user = updatedUser as User
    } else {
      // User doesn't exist, create a new one
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([{ email, name, preferences }])
        .select()
        .single()

      if (createError) {
        console.error("Error creating user:", createError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      user = newUser as User
    }

    // Send confirmation email
    try {
      await sendConfirmationEmail(user)
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
      // Continue even if email fails - don't fail the whole request
    }

    return NextResponse.json({
      user,
      message: existingUser
        ? "Your subscription has been updated successfully!"
        : "Your subscription has been created successfully!",
      isUpdate: !!existingUser,
    })
  } catch (error) {
    console.error("Subscription error:", error)
    return NextResponse.json({ error: "Failed to process subscription" }, { status: 500 })
  }
}
