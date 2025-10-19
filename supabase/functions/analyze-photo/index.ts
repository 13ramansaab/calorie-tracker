import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzePhotoRequest {
  image_url: string;
  aux_text?: string;
  user_id: string;
  meal_type?: string;
  user_region?: string;
  dietary_prefs?: string[];
}

interface DetectedFood {
  name: string;
  portion: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

interface AnalysisResponse {
  items: DetectedFood[];
  overall_confidence: number;
  explanation?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const body: AnalyzePhotoRequest = await req.json();
    const { image_url, aux_text, user_id, meal_type, user_region, dietary_prefs } = body;

    if (!image_url || !user_id) {
      return new Response(
        JSON.stringify({ error: "image_url and user_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `You are a nutrition AI that analyzes food photos and returns structured nutrition data.

RULES:
1. Identify all visible food items
2. Estimate portion sizes in grams
3. Calculate calories and macros (protein, carbs, fat in grams)
4. Assign confidence scores (0.0-1.0)
5. Consider regional context: ${user_region || "India"}
6. Account for dietary preferences: ${dietary_prefs?.join(", ") || "None"}
${aux_text ? `7. User note: "${aux_text}" - Use this to refine quantities and identification` : ""}

OUTPUT FORMAT (JSON only, no markdown):
{
  "items": [
    {
      "name": "chapati",
      "portion": 70,
      "calories": 140,
      "protein": 4.2,
      "carbs": 28.0,
      "fat": 2.1,
      "confidence": 0.85
    }
  ],
  "overall_confidence": 0.85,
  "explanation": "Brief reasoning"
}`;

    const userPrompt = meal_type
      ? `Analyze this ${meal_type} meal photo. ${aux_text ? `User says: "${aux_text}"` : ""}`
      : `Analyze this meal photo. ${aux_text ? `User says: "${aux_text}"` : ""}`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: image_url,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const openaiData = await openaiResponse.json();
    const rawContent = openaiData.choices[0]?.message?.content;

    if (!rawContent) {
      throw new Error("No response from OpenAI");
    }

    let parsedResponse: AnalysisResponse;
    try {
      const cleanedContent = rawContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({
          error: "error_invalid_json",
          raw_response: rawContent,
          message: "Failed to parse AI response as JSON",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!parsedResponse.items || !Array.isArray(parsedResponse.items)) {
      return new Response(
        JSON.stringify({
          error: "error_invalid_schema",
          message: "Response missing required 'items' array",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validatedItems = parsedResponse.items.map((item) => ({
      name: item.name || "Unknown",
      portion: item.portion || 100,
      calories: item.calories || 0,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      confidence: item.confidence || 0.5,
    }));

    return new Response(
      JSON.stringify({
        items: validatedItems,
        overall_confidence: parsedResponse.overall_confidence || 0.7,
        explanation: parsedResponse.explanation,
        raw_response: rawContent,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in analyze-photo function:", error);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
