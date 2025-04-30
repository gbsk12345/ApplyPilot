import "dotenv/config";
import { chromium } from "playwright";
import HyperAgent from "@hyperbrowser/agent";
import { ChatOpenAI } from "@langchain/openai";

/**
 * applyToJob: uses an LLM-driven agent to auto-fill a job form.
 * @param {string} url - the URL of the job application page
 * @param {Object} userData - key/value pairs of form labels → values
 */
export async function applyToJob(url, userData) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment");
  }

  // 2) Configure LLM + agent
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini"
  });
  const agent = new HyperAgent({ llm });

  // 3) Build a prompt describing the desired form entries
  let prompt = `Fill out and input into fields of the job form at ${url} with these values:\n`;
  for (const [field, value] of Object.entries(userData)) {
    prompt += `- ${field}: ${value}\n`;
  }
  console.log("Prompt:", prompt);
  // 4) Execute the LLM-driven task
  await agent.executeTask(prompt, {
    onStep: (step) => {
      console.log(`STEP ${step.idx}: ${step.action ?? step.instruction}`);
    }
  });


  // 6) Close agent + browser
  await agent.closeAgent();
}
