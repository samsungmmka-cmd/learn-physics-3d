// Vercel entry point: Vercel runs this file as a serverless function and passes every request to Express.
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';

export default createApp(loadConfig());
