export interface CodeAction {
    id: string;
    type: "create" | "modify" | "delete";
    filePath: string;
    content: string;
    lineNumber?: number;
    oldContent?: string;
    description?: string;
    confidence?: number; // 0-100
}

export interface AIResponse {
    explanation: string;
    actions?: CodeAction[];
    hasCode: boolean;
    confidence?: number; // Overall confidence
}
