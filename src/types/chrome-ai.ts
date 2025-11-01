// Chrome AI API Type Definitions for Hackathon 2025

export interface ChromeAI {
  languageModel: {
    capabilities(): Promise<AILanguageModelCapabilities>;
    create(options?: AILanguageModelCreateOptions): Promise<AILanguageModel>;
  };
  summarizer: {
    capabilities(): Promise<AISummarizerCapabilities>;
    create(options?: AISummarizerCreateOptions): Promise<AISummarizer>;
  };
  writer: {
    capabilities(): Promise<AIWriterCapabilities>;
    create(options?: AIWriterCreateOptions): Promise<AIWriter>;
  };
  rewriter: {
    capabilities(): Promise<AIRewriterCapabilities>;
    create(options?: AIRewriterCreateOptions): Promise<AIRewriter>;
  };
  translator: {
    capabilities(): Promise<AITranslatorCapabilities>;
    create(options?: AITranslatorCreateOptions): Promise<AITranslator>;
  };
  proofreader: {
    capabilities(): Promise<AIProofreaderCapabilities>;
    create(options?: AIProofreaderCreateOptions): Promise<AIProofreader>;
  };
}

// Language Model (Prompt API)
export interface AILanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTopK?: number;
  maxTopK?: number;
  defaultTemperature?: number;
  maxTemperature?: number;
}

export interface AILanguageModelCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  systemPrompt?: string;
  initialPrompts?: AILanguageModelInitialPrompt[];
  topK?: number;
  temperature?: number;
}

export interface AILanguageModelInitialPrompt {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AILanguageModel {
  prompt(input: string, options?: AILanguageModelPromptOptions): Promise<string>;
  promptStreaming(input: string, options?: AILanguageModelPromptOptions): ReadableStream<string>;
  countPromptTokens(input: string, options?: AILanguageModelPromptOptions): Promise<number>;
  maxTokens: number;
  tokensSoFar: number;
  tokensLeft: number;
  topK: number;
  temperature: number;
  clone(options?: AILanguageModelCloneOptions): Promise<AILanguageModel>;
  destroy(): void;
}

export interface AILanguageModelPromptOptions {
  signal?: AbortSignal;
}

export interface AILanguageModelCloneOptions {
  signal?: AbortSignal;
}

// Summarizer API
export interface AISummarizerCapabilities {
  available: 'readily' | 'after-download' | 'no';
  supportsType?: (type: AISummarizerType) => 'readily' | 'after-download' | 'no';
  supportsFormat?: (format: AISummarizerFormat) => 'readily' | 'after-download' | 'no';
  supportsLength?: (length: AISummarizerLength) => 'readily' | 'after-download' | 'no';
}

export interface AISummarizerCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  type?: AISummarizerType;
  format?: AISummarizerFormat;
  length?: AISummarizerLength;
}

export type AISummarizerType = 'tl;dr' | 'key-points' | 'teaser' | 'headline';
export type AISummarizerFormat = 'markdown' | 'plain-text';
export type AISummarizerLength = 'short' | 'medium' | 'long';

export interface AISummarizer {
  summarize(input: string, options?: AISummarizerSummarizeOptions): Promise<string>;
  summarizeStreaming(input: string, options?: AISummarizerSummarizeOptions): ReadableStream<string>;
  destroy(): void;
}

export interface AISummarizerSummarizeOptions {
  signal?: AbortSignal;
  context?: string;
}

// Writer API
export interface AIWriterCapabilities {
  available: 'readily' | 'after-download' | 'no';
  supportsFormat?: (format: AIWriterFormat) => 'readily' | 'after-download' | 'no';
  supportsLength?: (length: AIWriterLength) => 'readily' | 'after-download' | 'no';
  supportsTone?: (tone: AIWriterTone) => 'readily' | 'after-download' | 'no';
}

export interface AIWriterCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  format?: AIWriterFormat;
  length?: AIWriterLength;
  tone?: AIWriterTone;
}

export type AIWriterFormat = 'markdown' | 'plain-text';
export type AIWriterLength = 'short' | 'medium' | 'long';
export type AIWriterTone = 'formal' | 'neutral' | 'casual';

export interface AIWriter {
  write(input: string, options?: AIWriterWriteOptions): Promise<string>;
  writeStreaming(input: string, options?: AIWriterWriteOptions): ReadableStream<string>;
  destroy(): void;
}

export interface AIWriterWriteOptions {
  signal?: AbortSignal;
  context?: string;
}

// Rewriter API
export interface AIRewriterCapabilities {
  available: 'readily' | 'after-download' | 'no';
  supportsFormat?: (format: AIRewriterFormat) => 'readily' | 'after-download' | 'no';
  supportsLength?: (length: AIRewriterLength) => 'readily' | 'after-download' | 'no';
  supportsTone?: (tone: AIRewriterTone) => 'readily' | 'after-download' | 'no';
}

export interface AIRewriterCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  format?: AIRewriterFormat;
  length?: AIRewriterLength;
  tone?: AIRewriterTone;
}

export type AIRewriterFormat = 'markdown' | 'plain-text';
export type AIRewriterLength = 'as-is' | 'shorter' | 'longer';
export type AIRewriterTone = 'as-is' | 'more-formal' | 'more-casual';

export interface AIRewriter {
  rewrite(input: string, options?: AIRewriterRewriteOptions): Promise<string>;
  rewriteStreaming(input: string, options?: AIRewriterRewriteOptions): ReadableStream<string>;
  destroy(): void;
}

export interface AIRewriterRewriteOptions {
  signal?: AbortSignal;
  context?: string;
}

// Translator API
export interface AITranslatorCapabilities {
  available: 'readily' | 'after-download' | 'no';
  canTranslate?: (sourceLanguage: string, targetLanguage: string) => 'readily' | 'after-download' | 'no';
}

export interface AITranslatorCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface AITranslator {
  translate(input: string, options?: AITranslatorTranslateOptions): Promise<string>;
  translateStreaming(input: string, options?: AITranslatorTranslateOptions): ReadableStream<string>;
  destroy(): void;
}

export interface AITranslatorTranslateOptions {
  signal?: AbortSignal;
}

// Proofreader API
export interface AIProofreaderCapabilities {
  available: 'readily' | 'after-download' | 'no';
}

export interface AIProofreaderCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
}

export interface AIProofreader {
  proofread(input: string, options?: AIProofreaderProofreadOptions): Promise<string>;
  proofreadStreaming(input: string, options?: AIProofreaderProofreadOptions): ReadableStream<string>;
  destroy(): void;
}

export interface AIProofreaderProofreadOptions {
  signal?: AbortSignal;
  context?: string;
}

// Common interfaces
export interface AICreateMonitor {
  addEventListener(type: 'downloadprogress', listener: (event: AIDownloadProgressEvent) => void): void;
}

export interface AIDownloadProgressEvent {
  loaded: number;
  total: number;
}

// Global Chrome AI declaration
declare global {
  interface Window {
    ai?: ChromeAI;
  }
}

// Orb-specific AI operation types
export type OrbAIOperation = 
  | 'summarize'
  | 'rewrite'
  | 'translate'
  | 'proofread'
  | 'enhance-prompt'
  | 'write'
  | 'auto-correct';

export interface OrbAIRequest {
  operation: OrbAIOperation;
  text: string;
  context?: string;
  options?: {
    tone?: string;
    length?: string;
    format?: string;
    targetLanguage?: string;
  };
}

export interface OrbAIResponse {
  success: boolean;
  result?: string;
  error?: string;
  operation: OrbAIOperation;
}

export interface TextSelection {
  text: string;
  element: HTMLElement;
  range: Range;
  position: { x: number; y: number };
}