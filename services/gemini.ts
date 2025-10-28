// FIX: Import 'Chat' type from '@google/genai'
// FIX: Aliased 'Chat' to 'GenAIChat' to avoid potential naming conflicts with browser APIs.
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse, Part, Chat as GenAIChat } from "@google/genai";
import { ChatMessage, Product, Sale, AIInsight } from '../types';
import { storage } from './storage';

let ai: GoogleGenAI | null = null;
const apiKey = storage.getGeminiApiKey() || process.env.API_KEY;

try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
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

export const generateProductTitleAndCategory = async (base64ImageData: string, categories: string[]): Promise<{ title: string; category: string } | null> => {
    if (!ai) return null;

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData,
        },
    };
    
    const textPart = {
        text: `Analyse l'objet dans cette image. En te basant sur la liste de catégories fournie, choisis la catégorie la plus appropriée pour cet objet. Donne également à l'objet un nom de produit simple et descriptif.

Liste des catégories disponibles : [${categories.join(', ')}]

Réponds avec un objet JSON au format : {"title": "Nom du produit", "category": "Catégorie choisie"}`
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING },
                    },
                    required: ['title', 'category'],
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating product title and category:", error);
        return null;
    }
};

const imageUrlToBase64 = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        const reader = new FileReader();
        return new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result.split(',')[1]);
                } else {
                    reject('Failed to convert blob to base64');
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Failed to fetch image for visual matching:", url, e);
        return null;
    }
};

export const getBestVisualMatch = async (userImageBase64: string, candidateProducts: Product[]): Promise<Product | null> => {
    if (!ai) return null;

    const candidatesWithImages = candidateProducts.filter(p => p.imageUrl).slice(0, 4);
    if (candidatesWithImages.length === 0) return null;

    try {
        const userImagePart: Part = { inlineData: { mimeType: 'image/jpeg', data: userImageBase64 } };
        const candidateImageParts: Part[] = [];
        const candidateIds: number[] = [];

        const imagePromises = candidatesWithImages.map(async (p) => {
            const b64 = await imageUrlToBase64(p.imageUrl!);
            if (b64) {
                candidateImageParts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
                candidateIds.push(p.id);
            }
        });
        
        await Promise.all(imagePromises);

        if (candidateImageParts.length === 0) return null;

        const prompt = `La première image est l'image de l'utilisateur. Les images suivantes sont des produits candidats. 
Les ID de produit pour les images candidates sont, dans l'ordre : [${candidateIds.join(', ')}].
Identifie le produit qui correspond le mieux à l'image de l'utilisateur et réponds avec son ID dans un objet JSON. 
Format de réponse : {"matchId": ID_DU_PRODUIT}`;
        const textPart: Part = { text: prompt };

        const allParts: Part[] = [textPart, userImagePart, ...candidateImageParts];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: allParts }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        matchId: { type: Type.NUMBER },
                    },
                    required: ['matchId'],
                }
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        const matchedProduct = candidateProducts.find(p => p.id === result.matchId);
        return matchedProduct || null;
    } catch (error) {
        console.error("Error getting best visual match:", error);
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

let chat: GenAIChat | null = null;
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