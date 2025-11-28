import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Step } from "../types";

export const aiService = {
  async executeStep(userMessage: string, step: Step, apiKey: string, modelName: string = "gpt-4o-mini"): Promise<string> {
    const key = apiKey?.trim();
    
    if (!key) {
        throw new Error("OpenAI API Key is missing. Please enter it in the top right corner.");
    }

    const chat = new ChatOpenAI({
      apiKey: key,
      modelName: modelName, 
      temperature: 0.7,
      // @ts-ignore - 'dangerouslyAllowBrowser' is valid in runtime for browser usage but might not be in type definition depending on version
      dangerouslyAllowBrowser: true,
      configuration: {
        dangerouslyAllowBrowser: true
      }
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

  async evaluateResponse(
      aiResponse: string, 
      userEvalCriteria: string, 
      step: Step, 
      apiKey: string, 
      modelName: string = "gpt-4o-mini"
  ): Promise<string> {
    const key = apiKey?.trim();
    if (!key) throw new Error("Missing API Key");

    const chat = new ChatOpenAI({
      apiKey: key,
      modelName: modelName,
      temperature: 0, // Deterministic for evaluation
      // @ts-ignore
      dangerouslyAllowBrowser: true,
      configuration: { dangerouslyAllowBrowser: true }
    });

    const messages = [];

    // System Prompt: The Success Condition defined in the Step
    // If no success condition is defined, we provide a default judge persona
    const systemPrompt = step.successCondition.content 
        ? step.successCondition.content 
        : "You are an impartial judge evaluating an AI's response based on specific criteria.";
    
    messages.push(new SystemMessage(systemPrompt));

    // User Prompt: The Evaluation Context
    const evalContent = `
    [CONTEXT]
    The AI produced the following output:
    "${aiResponse}"

    [EVALUATION CRITERIA]
    ${userEvalCriteria}

    [INSTRUCTION]
    Evaluate if the output meets the criteria. Be concise.
    `;

    messages.push(new HumanMessage(evalContent));

    try {
        const response = await chat.invoke(messages);
        return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    } catch (error) {
        console.error("AI Evaluation Error:", error);
        throw error;
    }
  }
};
