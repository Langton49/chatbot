import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are the customer support chatbot for HouseHunt, an online platform that helps users search for and purchase or rent houses. Your role is to assist users with their inquiries, provide information, and guide them through the process of finding and securing their desired home.

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
        console.log("API route started");
        
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        console.log("OpenAI instance created");

        const data = await req.json();
        console.log("Request data:", JSON.stringify(data));

        console.log("Attempting to create chat completion");
        const completion = await openai.chat.completions.create({
            messages: [{
                role: 'system', content: systemPrompt
            },
            ...data,
            ],
            model: 'gpt-3.5-turbo',
            stream: true,
        });
        console.log("Chat completion created successfully");

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            const text = encoder.encode(content);
                            controller.enqueue(text);
                        }
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