import client from "../client";

export async function POST(request) {
    try {
        // 1. Properly parse the request body
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return Response.json({ success: false, response: "Email is required" }, { status: 400 });
        }

        // 2. Check if the user exists
        const { data: staffMember, error: fetchError } = await client
            .from('staff')
            .select("*")
            .eq('email', email)
            .single(); // Use .single() if you expect only one record

        if (fetchError || !staffMember) {
            return Response.json({
                success: false,
                response: "Not a valid user"
            }, { status: 404 });
        }

        // 3. Generate a strict 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000);

        // 4. Update the record
        // Note: Supabase .update() by default doesn't return data unless you add .select()
        const { error: updateError } = await client
            .from("staff")
            .update({ otp: otp })
            .eq('email', email);

        if (updateError) {
            throw new Error(updateError.message);
        }

        const emailRes = await fetch(`http://localhost:3000/api/smtp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: staffMember.email,
                otp: otp
            }),
        });

        const emailResult = await emailRes.json();
        if (emailResult) { }
        return Response.json({
            success: true,
            response: "OTP saved",
            // otp: otp // Usually you'd send this via email, not return it!
        });
    }

    catch (error) {
        console.error("Server Error:", error);
        return Response.json({
            success: false,
            response: "Internal server error",
            error: error.message
        }, { status: 500 });
    }
}