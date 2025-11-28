import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Step } from "../types";

export const aiService = {
  async executeStep(userMessage: string, step: Step, apiKey: string, modelName: string = "gpt-4o-mini"): Promise<string> {
    // Ensure we have a valid string
    const key = apiKey?.trim();
    
    if (!key) {
        throw new Error("OpenAI API Key is missing. Please enter it in the top right corner.");
    }

    const chat = new ChatOpenAI({
      apiKey: key, // Using 'apiKey' which is standard in newer SDKs
      modelName: modelName, 
      temperature: 0.7,
      // dangerouslyAllowBrowser is often a top-level option in @langchain/openai, 
      // but sometimes passed via configuration depending on exact version.
      // We'll pass it at top level AND in configuration to be safe.
      dangerouslyAllowBrowser: true,
      // configuration: {
      //   dangerouslyAllowBrowser: true
      // }
    });

    const messages = [];

    if (step.execution.content) {
        messages.push(new SystemMessage(step.execution.content));
    }

    messages.push(new HumanMessage(userMessage));

    try {
        const response = await chat.invoke(messages);
        return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    } catch (error) {
        console.error("AI Execution Error:", error);
        throw error; 
    }
  },

  async validateResponse(response: string, step: Step, apiKey: string): Promise<boolean> {
      return true;
  }
};
