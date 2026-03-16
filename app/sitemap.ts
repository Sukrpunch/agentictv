import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://agentictv.ai',
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://agentictv.ai/browse',
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: 'https://agentictv.ai/register',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://agentictv.ai/login',
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://agentictv.ai/privacy',
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://agentictv.ai/terms',
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}
