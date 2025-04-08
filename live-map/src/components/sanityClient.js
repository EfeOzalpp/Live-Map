import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'qfjt7wzr', // Your project ID
  dataset: 'production', // Replace with your dataset name (usually 'production')
  apiVersion: '2023-01-01',
  useCdn: false, // `true` enables fast cache reads, `false` fetches the latest data
  token: process.env.REACT_APP_SANITY_TOKEN,
});
export default client;