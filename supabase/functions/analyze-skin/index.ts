import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 Analyze-skin function called');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting request processing...');
    
    // Log request body
    const requestText = await req.text();
    console.log('Raw request body:', requestText);
    
    // Parse the request body
    const { images } = JSON.parse(requestText);
    console.log('Parsed images object keys:', Object.keys(images));

    if (!images || !images.front || !images.left || !images.right) {
      console.error('❌ Missing required images:', {
        front: !!images?.front,
        left: !!images?.left,
        right: !!images?.right
      });
      throw new Error('Missing required images');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured');
    }
    console.log('✅ OpenAI API key found');

    console.log('📝 Preparing OpenAI request...');
    const messages = [
      {
        role: 'system',
        content: `You are an expert medical aesthetician and dermatology specialist at a luxury medical spa. Your task is to analyze facial images and provide JSON-formatted recommendations for medical spa treatments. 

When analyzing the images, focus on these key areas to provide a comprehensive JSON response:

1. Skin Analysis (look for):
   - Fine lines and wrinkles
   - Volume loss and facial contours
   - Skin texture and tone
   - Pigmentation or discoloration
   - Pore size and appearance
   - Signs of aging
   - Skin laxity
   - Under-eye concerns

2. Treatment Recommendations should focus on medical spa services such as:
   - Botox/Neurotoxins for dynamic wrinkles
   - Dermal fillers for volume restoration
   - Laser treatments (e.g., IPL, Fraxel, CO2)
   - Chemical peels
   - Microneedling
   - HydraFacial or similar treatments
   - RF treatments for skin tightening
   - LED light therapy
   - Medical-grade skincare recommendations

Your response must be formatted as a JSON object with exactly this structure:
{
  "concerns": ["Observed condition 1", "Observed condition 2", "Observed condition 3", "Observed condition 4"],
  "recommendations": ["Specific treatment 1", "Specific treatment 2", "Specific treatment 3", "Specific treatment 4"]
}

Each concern must be paired with its corresponding treatment recommendation in the same array position. You must provide exactly 4 key observations and their matching treatment recommendations. Keep recommendations specific to medical spa treatments and procedures.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please analyze these facial images and provide personalized medical spa treatment recommendations:'
          },
          {
            type: 'image_url',
            image_url: {
              url: images.front
            }
          },
          {
            type: 'image_url',
            image_url: {
              url: images.left
            }
          },
          {
            type: 'image_url',
            image_url: {
              url: images.right
            }
          }
        ]
      }
    ];
    
    console.log('🔄 Making request to OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    console.log('OpenAI response status:', openaiResponse.status);
    console.log('OpenAI response headers:', Object.fromEntries(openaiResponse.headers.entries()));

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        errorDetails: errorText
      });
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('✅ Received response from OpenAI:', openaiData);

    if (!openaiData.choices?.[0]?.message?.content) {
      console.error('❌ Invalid response format from OpenAI:', openaiData);
      throw new Error('Invalid response format from OpenAI');
    }

    // Parse and validate the analysis
    let analysis;
    try {
      console.log('🔄 Parsing OpenAI response content:', openaiData.choices[0].message.content);
      analysis = JSON.parse(openaiData.choices[0].message.content);
      
      if (!analysis.concerns || !analysis.recommendations || 
          !Array.isArray(analysis.concerns) || !Array.isArray(analysis.recommendations) ||
          analysis.concerns.length !== analysis.recommendations.length ||
          analysis.concerns.length !== 4) {  // Updated to expect exactly 4 items
        console.error('❌ Invalid analysis format:', analysis);
        throw new Error('Invalid analysis format');
      }

      console.log('✅ Analysis validation passed:', analysis);
    } catch (error) {
      console.error('❌ Error parsing analysis:', error);
      console.error('Raw content:', openaiData.choices[0].message.content);
      throw new Error('Failed to parse analysis results');
    }

    console.log('✅ Analysis completed successfully');
    return new Response(JSON.stringify(analysis), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error in analyze-skin function:', {
      error: error.message,
      stack: error.stack
    });
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to analyze skin images'
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      }
    });
  }
});