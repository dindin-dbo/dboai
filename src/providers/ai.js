import axios from 'axios';

const PROVIDERS = {
  anthropic: {
    name: 'Anthropic (Claude)',
    baseURL: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5'],
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o3-mini'],
  },
  gemini: {
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  kimi: {
    name: 'Kimi (Moonshot)',
    baseURL: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  openrouter: {
    name: 'OpenRouter (all models)',
    baseURL: 'https://openrouter.ai/api/v1',
    models: ['anthropic/claude-sonnet-4-6', 'openai/gpt-4o', 'google/gemini-2.0-flash', 'deepseek/deepseek-chat', 'meta-llama/llama-3.1-405b-instruct'],
  },
  groq: {
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  mistral: {
    name: 'Mistral',
    baseURL: 'https://api.mistral.ai/v1',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'codestral-latest'],
  },
};

export function getProviderList() {
  return Object.entries(PROVIDERS).map(([key, val]) => ({ key, name: val.name }));
}

export function getModelsForProvider(provider) {
  return PROVIDERS[provider]?.models ?? [];
}

export async function callAI(config, systemPrompt, userPrompt) {
  const { ai_provider, ai_api_key, ai_model } = config;

  if (ai_provider === 'anthropic') {
    return callAnthropic(ai_api_key, ai_model, systemPrompt, userPrompt);
  }
  return callOpenAICompatible(ai_provider, ai_api_key, ai_model, systemPrompt, userPrompt);
}

async function callAnthropic(apiKey, model, systemPrompt, userPrompt) {
  const res = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    }
  );
  return res.data.content[0].text;
}

async function callOpenAICompatible(provider, apiKey, model, systemPrompt, userPrompt) {
  const baseURL = PROVIDERS[provider]?.baseURL;
  const res = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
    }
  );
  return res.data.choices[0].message.content;
}
