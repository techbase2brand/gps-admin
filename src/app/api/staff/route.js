import client from "../client";
import bcrypt from "bcryptjs";

export async function PUT(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // 1. Strict Validation: Ensure password exists AND is a string
        if (!email || typeof password !== 'string') {
            return Response.json({ 
                "response": "Valid email and password string are required" 
            }, { status: 400 });
        }

        // 2. Check if user exists first
        const { data: staffMember, error: fetchError } = await client
            .from('staff')
            .select("id")
            .eq('email', email)
            .single();

        if (fetchError || !staffMember) {
            return Response.json({ "error": "User not found" }, { status: 404 });
        }

        // 3. Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. Update the database
        // Destructure as { data, error } - Supabase returns 'data', not 'updatedData'
        const { data, error: updateError } = await client
            .from('staff')
            .update({ password: hashedPassword })
            .eq('email', email)
            .select();

        if (updateError) throw updateError;

        return Response.json({ 
            "success": true, 
            "message": "Password updated successfully" 
        });

    } catch (err) {
        console.error("BCRYPT/DB ERROR:", err);
        return Response.json({ "error": err.message }, { status: 500 });
    }
}