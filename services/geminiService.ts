import { Meal, ChatMessage, Order, User } from '../types';
import { getAppwriteJwt } from './appwriteClient';

async function postAiEndpoint<T = { text: string }>(
  path: string,
  payload: unknown,
  requireAuthHeader = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const jwt = await getAppwriteJwt();
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  } else if (requireAuthHeader) {
    throw new Error('Authentication required for this AI feature.');
  }

  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errCode = data.error || `HTTP_${res.status}`;
    throw new Error(errCode);
  }
  return data as T;
}

export const generateChatResponse = async (meal: Meal, userQuery: string): Promise<string> => {
  try {
    const data = await postAiEndpoint<{ text: string }>('/api/ai/meal-chat', {
      meal: {
        name: meal.name,
        description: meal.description,
        ingredients: meal.ingredients,
        calories: meal.calories,
      },
      userQuery,
    });
    return (data.text || '').trim();
  } catch (error: any) {
    console.error('Error generating chat response:', error);
    if (error.message === 'API_KEY_NOT_CONFIGURED') {
      return "I'm sorry, but the AI assistant is currently unavailable due to a configuration issue. Please try again later.";
    }
    return "I'm sorry, I encountered an issue trying to respond. Please try asking something else or check back later.";
  }
};

export const generateSupportChatResponse = async (
  userQuery: string,
  chatHistory: ChatMessage[] = []
): Promise<string> => {
  try {
    const data = await postAiEndpoint<{ text: string }>('/api/ai/support-chat', {
      userQuery,
      chatHistory: chatHistory.slice(-6).map(m => ({ sender: m.sender, text: m.text })),
    });
    return (data.text || '').trim();
  } catch (error: any) {
    console.error('Error generating support chat response:', error);
    if (error.message === 'API_KEY_NOT_CONFIGURED') {
      return "I'm sorry, but the AI support assistant is currently unavailable due to a configuration issue. Please try again later.";
    }
    return "I'm sorry, I couldn't process your request at the moment. Please try again or rephrase your question.";
  }
};

export const generateWhatsAppTemplateContent = async (
  purpose: string,
  variables: string[]
): Promise<string> => {
  try {
    const data = await postAiEndpoint<{ text: string }>(
      '/api/ai/whatsapp-template',
      { purpose, variables },
      true
    );
    return (data.text || '').trim();
  } catch (error: any) {
    console.error('Error generating WhatsApp template:', error);
    if (error.message === 'API_KEY_NOT_CONFIGURED') {
      return 'AI suggestions are currently unavailable due to a configuration issue.';
    }
    return `Sorry, I couldn't come up with a suggestion for "${purpose}" right now.`;
  }
};

export const generateMealSuggestion = async (preferences: string): Promise<string> => {
  try {
    const data = await postAiEndpoint<{ text: string }>('/api/ai/meal-suggestion', { preferences });
    return (data.text || '').trim();
  } catch (error: any) {
    console.error('Error generating meal suggestion:', error);
    if (error.message === 'API_KEY_NOT_CONFIGURED') {
      return 'AI suggestions are currently unavailable due to a configuration issue.';
    }
    return "Sorry, I couldn't come up with a suggestion right now.";
  }
};

export const generateCrmInsights = async (user: User, orders: Order[]): Promise<any> => {
  try {
    return await postAiEndpoint<any>(
      '/api/ai/crm-insights',
      {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          customerLoyaltyStatus: user.customerLoyaltyStatus,
          birthday: user.birthday,
        },
        orders: orders.slice(0, 5).map(o => ({
          orderDate: o.orderDate,
          totalAmount: o.totalAmount,
          items: o.items.map(i => ({ name: i.name })),
        })),
      },
      true
    );
  } catch (error: any) {
    console.error('Error generating CRM insights:', error);
    if (error.message === 'API_KEY_NOT_CONFIGURED') {
      return {
        error: "I'm sorry, but the AI assistant is currently unavailable due to a configuration issue. Please try again later.",
      };
    }
    return {
      error: "I'm sorry, I encountered an issue trying to generate insights. Please try asking something else or check back later.",
    };
  }
};
