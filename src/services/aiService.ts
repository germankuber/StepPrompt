import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import type { Step } from "../types";

export const aiService = {
  async executeStep(
      userMessage: string, 
      step: Step, 
      apiKey: string, 
      modelName: string = "gpt-4o-mini",
      history: Array<{ role: string, content: string }> = []
    ): Promise<string> {
    const key = apiKey?.trim();
    
    if (!key) {
        throw new Error("OpenAI API Key is missing. Please enter it in the top right corner.");
    }

    const chat = new ChatOpenAI({
      apiKey: key,
      modelName: modelName, 
      temperature: 0.7,
      // @ts-ignore
      dangerouslyAllowBrowser: true,
      configuration: {
        dangerouslyAllowBrowser: true
      }
    });

    const messages = [];

    // 1. System Message (Current Step Context)
    if (step.execution.content) {
        let executionContent = step.execution.content;
        // Replace {{UserMessage}} placeholder with actual user message if injectUserMessage is enabled
        if (step.execution.injectUserMessage) {
            executionContent = executionContent.replace(/\{\{UserMessage\}\}/g, userMessage);
        }
        messages.push(new SystemMessage(executionContent));
    }

    // 2. Chat History
    history.forEach(msg => {
        if (msg.role === 'user') {
            messages.push(new HumanMessage(msg.content));
        } else if (msg.role === 'assistant') {
            messages.push(new AIMessage(msg.content));
        }
        // We ignore 'system' messages from the history (e.g. error logs or step transitions)
    });

    // 3. Current User Message
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
      step: Step, 
      apiKey: string, 
      modelName: string = "gpt-4o-mini",
      originalUserMessage: string = '',
      genericEvaluatorPrompt: string = ''
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

    // System Prompt: Generic Evaluator Prompt (Global Rules)
    const systemPrompt = genericEvaluatorPrompt || "You are an impartial judge evaluating an AI's response based on specific criteria.";
    messages.push(new SystemMessage(systemPrompt));

    // User Prompt: The Step's Success Condition (Evaluator Prompt)
    let evalContent = step.successCondition.content || "";
    
    // Replace placeholders in the step's evaluator prompt
    // 1. {{UserMessage}} -> The original user message that triggered the AI response
    if (originalUserMessage) {
        evalContent = evalContent.replace(/\{\{UserMessage\}\}/g, originalUserMessage);
    }
    
    // 2. {{CharacterMessage}} -> The AI response being evaluated
    if (aiResponse) {
        evalContent = evalContent.replace(/\{\{CharacterMessage\}\}/g, aiResponse);
    }
    
    // We do NOT append userEvalCriteria automatically anymore, as the user wants full control via placeholders.
    // The 'originalUserMessage' passed above is now the user's feedback (userInput), so it's injected via {{UserMessage}}.

    messages.push(new HumanMessage(evalContent));

    try {
        const response = await chat.invoke(messages);
        return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    } catch (error) {
        console.error("AI Evaluation Error:", error);
        throw error;
    }
  },

  async handleFailResponse(
    genericFailPrompt: string,
    step: Step,
    lastUserMessage: string,
    lastAiResponse: string,
    apiKey: string,
    modelName: string = "gpt-4o-mini",
    stepMessagesHistory: Array<{ role: 'user' | 'assistant' | 'system', content: string }> = []
  ): Promise<string> {
    const key = apiKey?.trim();
    if (!key) throw new Error("Missing API Key");

    const chat = new ChatOpenAI({
      apiKey: key,
      modelName: modelName,
      temperature: 0.7,
      // @ts-ignore
      dangerouslyAllowBrowser: true,
      configuration: { dangerouslyAllowBrowser: true }
    });

    const messages = [];

    // 1. System Message: Generic Fail Prompt
    if (genericFailPrompt && genericFailPrompt.trim() !== '') {
        messages.push(new SystemMessage(genericFailPrompt));
    }

    // 2. User Message: Fail Prompt of current step
    // If fail prompt is missing, fallback to lastUserMessage to ensure we send something
    let failPromptContent = step.failCondition?.content || '{{UserMessage}}';
    
    // Replace {{UserMessage}} if present
    if (lastUserMessage) {
        failPromptContent = failPromptContent.replace(/\{\{UserMessage\}\}/g, lastUserMessage);
    }
    
    // Replace {{CharacterMessage}} with the last AI response (character message)
    if (lastAiResponse) {
        failPromptContent = failPromptContent.replace(/\{\{CharacterMessage\}\}/g, lastAiResponse);
    }
    
    // Replace {{StepMessagesHistory}} with formatted message history
    if (stepMessagesHistory && stepMessagesHistory.length > 0) {
        // Filter out system messages and format the history
        const formattedHistory = stepMessagesHistory
            .filter(msg => msg.role !== 'system')
            .map(msg => {
                const roleLabel = msg.role === 'user' ? 'Player' : 'Character';
                return `${roleLabel}:\n${msg.content}`;
            })
            .join('\n\n');
        
        failPromptContent = failPromptContent.replace(/\{\{StepMessagesHistory\}\}/g, formattedHistory);
    } else {
        // If no history, replace with empty string
        failPromptContent = failPromptContent.replace(/\{\{StepMessagesHistory\}\}/g, '');
    }
    
    messages.push(new HumanMessage(failPromptContent));

    try {
        const response = await chat.invoke(messages);
        return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    } catch (error) {
        console.error("AI Fail Response Error:", error);
        throw error;
    }
  }
};
