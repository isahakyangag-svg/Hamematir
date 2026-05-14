import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface ScrapedProduct {
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  sku?: string;
  characteristics?: Record<string, string>;
  images?: string[];
}

export async function simulateScrape(storeName: string, storeUrl: string): Promise<ScrapedProduct[]> {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. Returning empty products.");
    return [];
  }

  const prompt = `
    Вы — профессиональный веб-парсер для армянского агрегатора цен "Hamematir".
    МАГАЗИН: "${storeName}" (${storeUrl}).
    
    ЗАДАЧА: Спарсить максимально полный и реалистичный список товаров (25-30 позиций).
    ВАЖНО: Если это Viva Electronics, обязательно включите следующие категории:
    1. Телефоны и гаджеты (iPhone 15/16, Samsung S24, Xiaomi).
    2. Ноутбуки и компьютеры (MacBook Air/Pro, ASUS ROG, Lenovo).
    3. ТВ и Аудио (Sony Bravia, Samsung QLED, JBL колонки).
    4. Крупная бытовая техника (Холодильники LG, Стиральные машины Samsung/Beko).
    5. Мелкая бытовая техника (Роботы-пылесосы, Кофемашины, Фены Dyson).
    6. Игровые консоли (PS5, Xbox, Nintendo).

    ТРЕБОВАНИЯ К ДАННЫМ:
    - Названия: Полные, с указанием характеристик (напр. "Apple iPhone 15 Pro 256GB Black Titanium").
    - Цены: В армянских драмах (AMD), актуальные (напр. 450000 - 650000 для iPhone).
    - Категории: Смартфоны, Ноутбуки, ТВ и Аудио, Бытовая техника, Кухня, Гейминг, Фото.
    - Описание: Подробное, на русском или армянском.
    - Характеристики: Минимум 4 ключа (Бренд, Модель, Память/Мощность, Цвет и т.д.).
    - Изображения: Ссылки на Unsplash, соответствующие товару (напр. https://images.unsplash.com/photo-1591337676887-a217a6970a8a для телефонов).

    Верните только чистый JSON массив объектов:
    [{ "name": "...", "price": 0, "image": "...", "category": "...", "description": "...", "sku": "...", "characteristics": {}, "images": ["..."] }]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (text) {
      // Remove any potentially surrounding markdown if necessary, although responseMimeType should handle it
      const cleanJson = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
      return JSON.parse(cleanJson);
    }
    return [];
  } catch (error) {
    console.error("Gemini scrape simulation failed:", error);
    return [];
  }
}
