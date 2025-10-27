import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentRequest, Chat, GenerateContentResponse, Part } from "@google/genai";
import { ChatMessage, Product, Sale, AIInsight } from '../types';

let ai: GoogleGenAI | null = null;
try {
    if (process.env.API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
        console.warn("Google GenAI API key not found. AI features will be disabled.");
    }
} catch (e) {
    console.error("Failed to initialize GoogleGenAI:", e);
}

// Function for Product Form
export const generateProductInfo = async (name: string, category: string, supplier: string): Promise<{ name: string; description: string } | null> => {
    if (!ai) return null;
    const prompt = `Génère un nom de produit marketing et une description de produit attrayante pour un article avec les détails suivants. Le nom doit être une légère amélioration de l'original, le rendant plus attrayant. La description doit être un paragraphe court (2-3 phrases).

Nom original : ${name}
Catégorie : ${category}
Fournisseur : ${supplier}

Réponds avec un objet JSON au format : {"name": "Nouveau Nom Marketing", "description": "Description du produit ici."}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Le nouveau nom marketing du produit." },
                        description: { type: Type.STRING, description: "La description marketing du produit." },
                    },
                    required: ['name', 'description'],
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating product info:", error);
        return null;
    }
};

export const getDashboardInsights = async (products: Product[], sales: Sale[]): Promise<AIInsight[] | null> => {
    if (!ai) return null;

    // Summarize data to send to the model
    const totalRevenue = sales.reduce((acc, s) => acc + s.totalPrice, 0);
    const totalProfit = sales.reduce((acc, s) => acc + (s.totalMargin || 0), 0);
    const unitsSold = sales.reduce((acc, s) => acc + s.quantity, 0);

    const productSales = sales.reduce<Record<string, number>>((acc, sale) => {
        acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity;
        return acc;
    }, {});

    const topSellers = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => `${name} (${quantity} sold)`);

    const slowMovers = products
        .filter(p => p.stock > 0 && !productSales[p.name])
        .slice(0, 5)
        .map(p => `${p.name} (stock: ${p.stock})`);
        
    const outOfStock = products.filter(p => p.stock === 0).map(p => p.name);

    const dataSummary = `
- Total Revenue: ${totalRevenue.toFixed(2)} DZD
- Total Profit: ${totalProfit.toFixed(2)} DZD
- Total Units Sold: ${unitsSold}
- Top 5 Best-Selling Products: ${topSellers.join(', ') || 'None'}
- Potentially Slow-Moving Products (in stock but no recent sales): ${slowMovers.join(', ') || 'None'}
- Out of Stock Products: ${outOfStock.join(', ') || 'None'}
`;

    const prompt = `Based on the following summary of sales and inventory data, generate 2-3 concise, actionable insights for the business owner. Identify a best-selling product, predict revenue trends, and highlight a potential risk (like a slow-moving item or a category that's out of stock). For each insight, provide a short title and a one-sentence description.

Data Summary:
${dataSummary}

Respond with a JSON array where each object has "type" ('positive', 'negative', 'neutral'), "title", and "description".`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ['type', 'title', 'description'],
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        const insights: AIInsight[] = JSON.parse(jsonText);
        return insights;
    } catch (error) {
        console.error("Error generating dashboard insights:", error);
        return null;
    }
};

export const findProductByImage = async (base64ImageData: string): Promise<string | null> => {
    if (!ai) return null;

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData,
        },
    };
    const textPart = {
        text: "Décris brièvement et précisément l'objet principal dans cette image en quelques mots-clés. Par exemple : 'montre chronographe noire bracelet cuir'.",
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        return response.text;
    } catch (error) {
        console.error("Error finding product by image:", error);
        return null;
    }
};


const tools: FunctionDeclaration[] = [
    {
        name: 'addProduct',
        description: 'Ajoute un nouveau produit à l\'inventaire.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'Nom du produit.' },
                category: { type: Type.STRING, description: 'Catégorie du produit.' },
                supplier: { type: Type.STRING, description: 'Fournisseur du produit.' },
                buyPrice: { type: Type.NUMBER, description: 'Prix d\'achat du produit.' },
                sellPrice: { type: Type.NUMBER, description: 'Prix de vente du produit.' },
                stock: { type: Type.INTEGER, description: 'Quantité en stock.' }
            },
            required: ['name', 'category', 'buyPrice', 'sellPrice', 'stock']
        }
    },
    {
        name: 'addSale',
        description: 'Enregistre une nouvelle vente pour un produit.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                productName: { type: Type.STRING, description: 'Nom du produit à vendre.' },
                quantity: { type: Type.INTEGER, description: 'Nombre d\'unités à vendre.' }
            },
            required: ['productName', 'quantity']
        }
    },
    {
        name: 'getProductInfo',
        description: 'Recherche des produits et récupère leurs informations.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                productName: { type: Type.STRING, description: 'Nom du produit à rechercher.' },
                category: { type: Type.STRING, description: 'Filtrer par catégorie.' },
                supplier: { type: Type.STRING, description: 'Filtrer par fournisseur.' },
                stockLevel: { type: Type.STRING, enum: ['low', 'out_of_stock'], description: 'Filtrer par niveau de stock bas ou en rupture.' }
            },
        }
    },
    {
        name: 'getSalesInfo',
        description: 'Récupère les statistiques de ventes comme le revenu total et le bénéfice.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                timeRange: { type: Type.STRING, enum: ['today', 'this week', 'this month', 'this year'], description: 'La période pour laquelle récupérer les statistiques.' }
            },
            required: ['timeRange']
        }
    },
    {
        name: 'navigateTo',
        description: 'Navigue vers une page spécifique de l\'application.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                page: { type: Type.STRING, enum: ['dashboard', 'products', 'delivery', 'sales', 'statistics', 'history', 'settings'], description: 'La page vers laquelle naviguer.' }
            },
            required: ['page']
        }
    }
];

let chat: Chat | null = null;
const getChat = () => {
    if (!ai) return null;
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                tools: [{ functionDeclarations: tools }],
                systemInstruction: "Tu es Hugo, un assistant IA pour une application de gestion d'inventaire. Sois concis, amical et efficace. N'invente pas d'informations. Utilise les outils fournis pour répondre aux demandes de l'utilisateur. Si tu ne peux pas faire quelque chose, dis-le poliment. L'utilisateur est français."
            }
        });
    }
    return chat;
};

export const startNewChat = () => {
    chat = null;
}

export const getAssistantResponse = async (history: ChatMessage[]): Promise<GenerateContentResponse> => {
    const currentChat = getChat();
    if (!currentChat) throw new Error("AI not initialized");

    const geminiHistory = history.map(msg => ({
        role: msg.role,
        parts: msg.parts.map(part => {
            if (part.text) return { text: part.text };
            if (part.functionCall) return { functionCall: part.functionCall };
            if (part.functionResponse) return { functionResponse: part.functionResponse };
            return { text: ''};
        })
    }));

    const lastMessage = geminiHistory.pop();
    if (!lastMessage) throw new Error("No message to send");

    currentChat.history = geminiHistory;

    const result = await currentChat.sendMessage({ message: { parts: lastMessage.parts as Part[] } });
    return result;
};