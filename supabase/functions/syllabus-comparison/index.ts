declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

// @ts-ignore Deno runtime resolves URL imports for edge functions.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type HfChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: unknown;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { syllabusA, syllabusB } = await req.json();

    if (!syllabusA || !syllabusB) {
      return new Response(JSON.stringify({ error: 'syllabusA and syllabusB are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hfApiKey = Deno.env.get('HF_API_KEY');
    const hfModel = Deno.env.get('HF_MODEL') || 'Qwen/Qwen2.5-7B-Instruct:fastest';

    if (!hfApiKey) {
      return new Response(JSON.stringify({
        error: 'HF_API_KEY is not configured for this edge function',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = [
      'You are an academic evaluator. Compare syllabus A and syllabus B for transfer-credit relevance.',
      'Return strict JSON only with this schema:',
      '{',
      '  "match_percentage": number,',
      '  "reasoning": string',
      '}',
      'Rules:',
      '- match_percentage is between 0 and 100',
      '- reasoning is short (1-2 lines), specific to overlapping outcomes/topics',
      '- Output must be valid JSON only, no markdown, no extra text',
    ].join('\n');

    const userPrompt = `Syllabus A:\n${syllabusA}\n\nSyllabus B:\n${syllabusB}`;

    const hfResponse = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: hfModel,
        temperature: 0.2,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const rawText = await hfResponse.text();

    if (!hfResponse.ok) {
      return new Response(JSON.stringify({ error: `Hugging Face API error: ${rawText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let generated = '';
    try {
      const parsedHf = JSON.parse(rawText) as HfChatCompletionResponse;
      generated = String(parsedHf?.choices?.[0]?.message?.content || '');
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse Hugging Face response JSON' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!generated.trim()) {
      return new Response(JSON.stringify({ error: 'Hugging Face returned empty output' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const start = generated.indexOf('{');
    const end = generated.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      return new Response(JSON.stringify({ error: 'Model output did not contain JSON object' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jsonSlice = generated.slice(start, end + 1);

    let parsed: { match_percentage?: unknown; reasoning?: unknown };
    try {
      parsed = JSON.parse(jsonSlice);
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse model JSON output' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const matchPercentage = Number(parsed.match_percentage);
    const reasoning = String(parsed.reasoning || '').trim();

    if (!Number.isFinite(matchPercentage) || matchPercentage < 0 || matchPercentage > 100) {
      return new Response(JSON.stringify({ error: 'Invalid match_percentage from model output' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!reasoning) {
      return new Response(JSON.stringify({ error: 'Invalid reasoning from model output' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      match_percentage: Math.round(matchPercentage),
      reasoning,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: `Unexpected error: ${message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
