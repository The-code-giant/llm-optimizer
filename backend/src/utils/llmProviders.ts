import axios from 'axios';

export type LLMProvider = 'openai' | 'anthropic' | 'mistral';

export interface LLMResponse {
  text: string;
  raw: any;
}

export interface LLMCallOptions {
  provider?: LLMProvider;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  // Add more as needed
}

/**
 * Call an LLM provider with advanced prompt logic and provider selection.
 * Supports OpenAI (gpt-3.5-turbo), Anthropic (claude-3), and Mistral (mistral-tiny).
 */
export async function callLLM({
  provider = 'openai',
  prompt,
  systemPrompt = 'You are an SEO and LLM optimization expert.',
  temperature = 0.7,
  maxTokens = 512,
}: LLMCallOptions): Promise<LLMResponse> {
  if (provider === 'openai') {
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const text = openaiRes.data?.choices?.[0]?.message?.content || '';
    return { text, raw: openaiRes.data };
  }
  if (provider === 'anthropic') {
    const anthropicRes = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );
    const text = anthropicRes.data?.content?.[0]?.text || '';
    return { text, raw: anthropicRes.data };
  }
  if (provider === 'mistral') {
    const mistralRes = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-tiny',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const text = mistralRes.data?.choices?.[0]?.message?.content || '';
    return { text, raw: mistralRes.data };
  }
  throw new Error(`Unsupported LLM provider: ${provider}`);
} 