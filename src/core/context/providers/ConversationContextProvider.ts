// core/context/providers/ConversationContextProvider.ts
// Provides context from conversation history

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface ConversationContext {
  messages: ConversationMessage[];
  summary: string | null;
  topics: string[];
  totalTokens: number;
  startTime: number;
  lastActivity: number;
}

export class ConversationContextProvider {
  private conversations: Map<string, ConversationContext> = new Map();
  private readonly MAX_MESSAGES = 50;
  private readonly SUMMARY_THRESHOLD = 20; // Summarize after 20 messages

  /**
   * Get conversation context
   */
  getConversationContext(conversationId: string): ConversationContext | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Add message to conversation
   */
  addMessage(
    conversationId: string,
    message: Omit<ConversationMessage, 'timestamp'>
  ): void {
    let context = this.conversations.get(conversationId);

    if (!context) {
      context = {
        messages: [],
        summary: null,
        topics: [],
        totalTokens: 0,
        startTime: Date.now(),
        lastActivity: Date.now(),
      };
      this.conversations.set(conversationId, context);
    }

    // Add message
    const fullMessage: ConversationMessage = {
      ...message,
      timestamp: Date.now(),
      tokens: message.tokens || this.estimateTokens(message.content),
    };

    context.messages.push(fullMessage);
    context.totalTokens += fullMessage.tokens || 0;
    context.lastActivity = Date.now();

    // Extract topics
    this.extractTopics(context, fullMessage);

    // Trim old messages if needed
    if (context.messages.length > this.MAX_MESSAGES) {
      const removed = context.messages.shift();
      if (removed?.tokens) {
        context.totalTokens -= removed.tokens;
      }
    }

    // Check if we need to summarize
    if (context.messages.length >= this.SUMMARY_THRESHOLD && !context.summary) {
      this.createSummary(conversationId, context);
    }
  }

  /**
   * Get recent messages
   */
  getRecentMessages(
    conversationId: string,
    count: number = 10
  ): ConversationMessage[] {
    const context = this.conversations.get(conversationId);
    if (!context) return [];

    return context.messages.slice(-count);
  }

  /**
   * Get messages within token limit
   */
  getMessagesWithinTokenLimit(
    conversationId: string,
    maxTokens: number
  ): ConversationMessage[] {
    const context = this.conversations.get(conversationId);
    if (!context) return [];

    const messages: ConversationMessage[] = [];
    let tokenCount = 0;

    // Start from most recent and work backwards
    for (let i = context.messages.length - 1; i >= 0; i--) {
      const message = context.messages[i];
      const messageTokens = message.tokens || 0;

      if (tokenCount + messageTokens > maxTokens) {
        break;
      }

      messages.unshift(message);
      tokenCount += messageTokens;
    }

    return messages;
  }

  /**
   * Search messages by content
   */
  searchMessages(conversationId: string, query: string): ConversationMessage[] {
    const context = this.conversations.get(conversationId);
    if (!context) return [];

    const queryLower = query.toLowerCase();
    return context.messages.filter(msg =>
      msg.content.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Get conversation summary
   */
  getSummary(conversationId: string): string | null {
    const context = this.conversations.get(conversationId);
    return context?.summary || null;
  }

  /**
   * Get conversation topics
   */
  getTopics(conversationId: string): string[] {
    const context = this.conversations.get(conversationId);
    return context?.topics || [];
  }

  /**
   * Create conversation summary
   */
  private async createSummary(
    _conversationId: string,
    context: ConversationContext
  ): Promise<void> {
    try {
      // Get last 10 messages for summary
      const recentMessages = context.messages.slice(-10);
      
      const summaryText = `Konuşma özeti: ${recentMessages.length} mesaj içeriyor. ` +
        `Başlıca konular: ${context.topics.slice(0, 3).join(', ')}. ` +
        `Toplam ${context.totalTokens} token kullanıldı.`;

      context.summary = summaryText;
    } catch (error) {
      console.error('Failed to create summary:', error);
    }
  }

  /**
   * Extract topics from message
   */
  private extractTopics(context: ConversationContext, message: ConversationMessage): void {
    // Simple keyword extraction
    const keywords = message.content
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !this.isCommonWord(word));

    // Add unique keywords as topics
    keywords.forEach(keyword => {
      if (!context.topics.includes(keyword) && context.topics.length < 10) {
        context.topics.push(keyword);
      }
    });
  }

  /**
   * Check if word is common (should be filtered out)
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'this', 'that', 'with', 'from', 'have', 'been',
      'were', 'their', 'there', 'would', 'could', 'should',
      'about', 'which', 'these', 'those', 'other', 'some',
      'için', 'olan', 'olarak', 'gibi', 'daha', 'çok', 'kadar'
    ];
    return commonWords.includes(word);
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    // Simple estimation: words * 1.3
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 1.3);
  }

  /**
   * Clear conversation
   */
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  /**
   * Clear all conversations
   */
  clearAll(): void {
    this.conversations.clear();
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalConversations: this.conversations.size,
      conversations: Array.from(this.conversations.entries()).map(([id, ctx]) => ({
        id,
        messageCount: ctx.messages.length,
        totalTokens: ctx.totalTokens,
        topics: ctx.topics.length,
        hasSummary: !!ctx.summary,
      })),
    };
  }
}
