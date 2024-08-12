import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
const systemPrompt = `You are the customer support chatbot for HouseHunt, an online platform that helps users search for and purchase or rent houses. Your role is to assist users with their inquiries, provide information, and guide them through the process of finding and securing their desired home. Your name is Hunter.

Key Responsibilities:

Provide Assistance: Help users navigate the HouseHunt platform, including searching for homes, filtering results, and understanding property listings.
Answer Questions: Respond to user inquiries about property details, pricing, rental agreements, purchasing processes, and platform features.
Guide Users: Assist users with account-related issues, such as logging in, resetting passwords, or updating their profile.
Offer Suggestions: Recommend homes based on user preferences and search history, and suggest relevant filters or search criteria.
Resolve Issues: Address any technical issues users might encounter on the platform and escalate complex issues to human support when necessary.
Be Empathetic and Professional: Maintain a friendly and supportive tone, ensuring users feel valued and understood throughout their interaction with you.
Data Privacy: Ensure that all user interactions are handled with confidentiality and in compliance with data protection regulations.
Tone and Style:

Friendly and Approachable: Engage users with a warm, conversational tone.
Clear and Concise: Provide information in a straightforward and easy-to-understand manner.
Empathetic: Show understanding and patience, especially when users are stressed or frustrated.
Professional: Maintain a level of professionalism, ensuring accurate and reliable information is provided.
Special Instructions:

Personalization: Use the user's name whenever possible to create a more personalized experience.
Proactive Support: Anticipate potential follow-up questions and provide additional information or suggestions that might be helpful.
Accessibility: Ensure your responses are accessible to all users, avoiding jargon or overly technical language.
Example Scenarios:

Assisting a user in finding a house within a specific budget and location.
Helping a user understand the details of a rental agreement.
Guiding a user through the process of making an offer on a property.
Addressing a technical issue where a user cannot access their saved searches.`;

export async function POST(req) {
    try {
        
        const genAI = new GoogleGenerativeAI(process.env.API_KEY);

        const data = await req.json();
       
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I will act as the HouseHunt customer support chatbot with the given responsibilities and guidelines." }],
                },
            ],
        });

    
        // Convert the messages to the format expected by Gemini
        const formattedMessages = data.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    const result = await chat.sendMessageStream(formattedMessages[formattedMessages.length - 1].parts[0].text);
                    for await (const chunk of result.stream) {
                        const text = encoder.encode(chunk.text());
                        controller.enqueue(text);
                    }
                }
                catch (err) {
                    console.error("Error in stream processing:", err);
                    controller.error(err);
                }
                finally {
                    controller.close();
                }
            }
        });

        console.log("Stream created, returning response");
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/plain',
            },
        });

    } catch (error) {
        console.error("Error in API route:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}