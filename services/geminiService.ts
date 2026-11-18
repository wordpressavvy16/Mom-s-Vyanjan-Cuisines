

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Meal, ChatMessage, Order, User } from '../types'; // Added Order and User
import { GEMINI_MODEL_NAME } from '../constants';

// IMPORTANT: API_KEY must be obtained exclusively from process.env.API_KEY
// The application must not ask the user for it or define process.env.
// This service assumes process.env.API_KEY is available in the execution environment.

let ai: GoogleGenAI | null = null;

const getGenAIClient = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    // This case should ideally be handled by the environment ensuring API_KEY is set.
    // Throwing an error or having a visible issue is better than silently failing or using a hardcoded key.
    console.error("Gemini API Key (process.env.API_KEY) is not set. Gemini features will not work.");
    throw new Error("API_KEY_NOT_CONFIGURED");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const generateChatResponse = async (meal: Meal, userQuery: string): Promise<string> => {
  try {
    const client = getGenAIClient();
    const prompt = `You are a helpful AI assistant for a tiffin service called "MoM's Vyanjan".
A customer is asking about the meal: "${meal.name}".
Meal Description: "${meal.description}".
Meal Ingredients: ${meal.ingredients.join(', ')}.
${meal.calories ? `Approximate Calories: ${meal.calories}.` : ''}

Customer's question: "${userQuery}"

Please provide a concise, friendly, and helpful answer. If the question is unrelated to food, tiffins, or this meal, politely state that you can only answer food-related questions.
Keep your response to 2-3 sentences.`;

    const response: GenerateContentResponse = await client.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      // config: { thinkingConfig: { thinkingBudget: 0 } } // Disabling thinking for faster response for meal specific chat.
    });
    
    return response.text.trim();

  } catch (error: any) {
    console.error('Error generating chat response from Gemini:', error);
    if (error.message === "API_KEY_NOT_CONFIGURED") {
        return "I'm sorry, but the AI assistant is currently unavailable due to a configuration issue. Please try again later.";
    }
    return "I'm sorry, I encountered an issue trying to respond. Please try asking something else or check back later.";
  }
};

export const generateSupportChatResponse = async (userQuery: string, chatHistory: ChatMessage[] = []): Promise<string> => {
  try {
    const client = getGenAIClient();
    // Basic history formatting:
    const historyPrompt = chatHistory.map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n');

    const prompt = `You are a friendly and helpful customer support chatbot for 'MoM's Vyanjan Tiffin Service'.
Your role is to answer customer questions about our service (e.g., how to order, menu options, delivery areas, payment methods), help with general inquiries, and guide users on how to resolve complaints.
For specific complaints requiring investigation (e.g., issues with a past order, refunds), please advise them to contact our human support team at support@momsvyanjan.example.com or call us at 1-800-000-0000.
Do not ask for or handle sensitive personal information like order IDs or email addresses yourself.
Keep your answers concise and polite.

${historyPrompt ? `Conversation History:\n${historyPrompt}\n\n` : ''}User Query: "${userQuery}"
AI Response:`;

    const response: GenerateContentResponse = await client.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
         // For general support, higher quality might be preferred over lowest latency.
         // Omitting thinkingConfig to use default (enabled thinking).
    });
    
    return response.text.trim();

  } catch (error: any)
  {
    console.error('Error generating support chat response from Gemini:', error);
    if (error.message === "API_KEY_NOT_CONFIGURED") {
        return "I'm sorry, but the AI support assistant is currently unavailable due to a configuration issue. Please try again later.";
    }
    return "I'm sorry, I couldn't process your request at the moment. Please try again or rephrase your question.";
  }
};


export const generateWhatsAppTemplateContent = async (purpose: string, variables: string[]): Promise<string> => {
    try {
        const client = getGenAIClient();
        const prompt = `You are an expert copywriter for WhatsApp marketing.
        Write a concise, friendly, and engaging WhatsApp message template for a tiffin service named "MoM's Vyanjan".
        The purpose of this template is: "${purpose}".
        The template MUST include placeholders for the following variables, formatted as {{variable_name}} or {{number}}. The variables are: ${variables.join(', ')}.
        The response should be ONLY the template content itself, without any introduction, explanation, or markdown formatting.
        The template must comply with WhatsApp's commerce policies by being helpful and not overly promotional. Use WhatsApp formatting like *bold* and _italics_ sparingly and effectively.`;

        const response: GenerateContentResponse = await client.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: prompt,
            config: {
                temperature: 0.7, // A bit creative but not too random
            },
        });

        return response.text.trim();
    } catch (error: any) {
        console.error('Error generating WhatsApp template from Gemini:', error);
        if (error.message === "API_KEY_NOT_CONFIGURED") {
            return "AI suggestions are currently unavailable due to a configuration issue.";
        }
        return `Sorry, I couldn't come up with a suggestion for "${purpose}" right now.`;
    }
};

// Example of generating a meal suggestion (could be used elsewhere)
export const generateMealSuggestion = async (preferences: string): Promise<string> => {
  try {
    const client = getGenAIClient();
    const prompt = `As an AI for MoM's Vyanjan Tiffin Service, suggest a tiffin meal idea based on these preferences: "${preferences}". 
Provide a short, appealing name and a one-sentence description. For example: 'Sunshine Bowl: A vibrant mix of quinoa, roasted sweet potatoes, and fresh greens.'`;

    const response: GenerateContentResponse = await client.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    
    return response.text.trim();

  } catch (error: any) {
    console.error('Error generating meal suggestion from Gemini:', error);
     if (error.message === "API_KEY_NOT_CONFIGURED") {
        return "AI suggestions are currently unavailable due to a configuration issue.";
    }
    return "Sorry, I couldn't come up with a suggestion right now.";
  }
};

export const generateCrmInsights = async (user: User, orders: Order[]): Promise<any> => {
  try {
    const client = getGenAIClient();
    
    const orderSummary = orders.slice(0, 5).map(o => 
      `Order on ${o.orderDate.toLocaleDateString()}: ${o.items.map(i => i.name).join(', ')} for a total of $${o.totalAmount.toFixed(2)}.`
    ).join('\n');

    const prompt = `
      You are an expert CRM analyst for a tiffin service called "MoM's Vyanjan".
      Analyze the following customer and their recent order history to provide actionable insights.

      CUSTOMER DATA:
      - Name: ${user.firstName} ${user.lastName}
      - Email: ${user.email}
      - Role: ${user.role}
      - Loyalty Points: ${user.customerLoyaltyStatus?.points || 0}
      - Birthday: ${user.birthday || 'Not provided'}
      - Order History (last 5 orders):
      ${orderSummary || 'No recent orders.'}

      TASK:
      Based on this data, provide a JSON object with the following structure, ensuring all fields are present:
      {
        "customerSnapshot": "A brief, 2-sentence summary of the customer's value and engagement level.",
        "keyInsights": [
          { "type": "Loyalty", "insight": "Description of their loyalty status and potential.", "priority": "high" },
          { "type": "Churn Risk", "insight": "Analysis of churn risk based on order frequency. If risk is low, say so.", "priority": "medium" },
          { "type": "Upsell", "insight": "Suggest a specific upsell opportunity (e.g., 'Suggest a side dish with their next order'). If none, state that.", "priority": "low" },
          { "type": "Birthday", "insight": "Mention if their birthday is coming up soon (within the next 30 days).", "priority": "high" }
        ],
        "suggestedActions": [
          { "action": "Send Birthday Offer via WhatsApp", "details": "Craft a personalized birthday message with a special discount.", "isApplicable": false },
          { "action": "Launch Re-engagement Email", "details": "Send a 'we miss you' email with a small discount to encourage a new order.", "isApplicable": false },
          { "action": "Add to 'High Value' Segment", "details": "Tag this user for premium offers and priority support.", "isApplicable": false }
        ]
      }

      RULES:
      - Today's date is ${new Date().toLocaleDateString()}.
      - A birthday is 'coming up' if it's within the next 30 days.
      - Churn risk is high if there are no orders in the last 60 days. Medium if none in last 30. Low otherwise.
      - A customer is 'High Value' if they have over 5000 loyalty points or have placed more than 5 orders.
      - Make the insights and actions concise and directly usable by a CRM manager.
      - Ensure 'isApplicable' is a boolean based on the data and rules.
    `;

    const response: GenerateContentResponse = await client.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    // It's possible the Gemini response is wrapped in markdown, so we need to clean it.
    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }

    return JSON.parse(jsonString.trim());

  } catch (error: any) {
    console.error('Error generating CRM insights from Gemini:', error);
    if (error.message === "API_KEY_NOT_CONFIGURED") {
        return { error: "I'm sorry, but the AI assistant is currently unavailable due to a configuration issue. Please try again later."};
    }
    return { error: "I'm sorry, I encountered an issue trying to generate insights. Please try asking something else or check back later."};
  }
};
