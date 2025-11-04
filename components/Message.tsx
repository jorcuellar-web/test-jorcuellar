
import React from 'react';
import type { ChatMessage } from '../types';

interface MessageProps {
    message: ChatMessage;
}

// A simple regex to find markdown-style links and replace them.
// This is a basic implementation and won't cover all markdown cases.
const formatText = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    let formattedText = text
        .replace(boldRegex, '<strong>$1</strong>');

    // This part is tricky without a full markdown parser, so we'll just render it as text.
    // For a real app, a library like react-markdown would be better.
    // For now, we will just display the text with proper whitespace handling.
    return { __html: formattedText };
};


export const Message: React.FC<MessageProps> = ({ message }) => {
    const isUser = message.role === 'user';
    const hasSources = message.sources && message.sources.length > 0;

    const messageBubbleClasses = isUser
        ? 'bg-indigo-600 text-white ml-auto rounded-br-none'
        : 'bg-slate-700 text-gray-200 mr-auto rounded-bl-none';

    const renderTextWithLineBreaks = (text: string) => {
        return text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                <br />
            </React.Fragment>
        ));
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-xl max-w-xl md:max-w-2xl lg:max-w-3xl shadow-md ${messageBubbleClasses}`}>
                <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3">
                    {renderTextWithLineBreaks(message.text)}
                </div>

                {hasSources && (
                    <div className="mt-4 pt-3 border-t border-slate-600">
                        <h4 className="text-xs font-semibold text-slate-400 mb-2">Fuentes:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {message.sources?.map((source, index) => (
                                <a
                                    key={index}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-300 bg-slate-800 hover:bg-slate-600 p-2 rounded-md truncate transition-colors"
                                    title={source.title}
                                >
                                    <span className="font-medium">[{index + 1}]</span> {source.title}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
