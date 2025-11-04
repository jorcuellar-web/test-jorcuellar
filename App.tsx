
import React, { useState, useEffect, useRef } from 'react';
// FIX: Import GenerateContentResponse for proper typing.
import type { Chat, GenerateContentResponse } from '@google/genai';
import { createChatSession } from './services/geminiService';
import type { ChatMessage, Source } from './types';
import { Message } from './components/Message';

const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const session = createChatSession();
        if (session) {
            setChat(session);
        } else {
            setError("Failed to initialize chat session. Please check your API key and configuration.");
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = { role: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            // FIX: chat.sendMessage returns the GenerateContentResponse directly.
            // There is no nested 'response' property.
            const response: GenerateContentResponse = await chat.sendMessage(currentInput);
            
            const modelText = response.text;
            
            let sources: Source[] = [];
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
                const fetchedSources = groundingMetadata.groundingChunks
                    .map((chunk: any) => ({
                        uri: chunk.web?.uri || '',
                        title: chunk.web?.title || '',
                    }))
                    .filter((source: Source) => source.uri && source.title);

                // Deduplicate sources based on URI
                sources = Array.from(new Map(fetchedSources.map(s => [s.uri, s])).values());
            }

            const modelMessage: ChatMessage = { role: 'model', text: modelText, sources };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            console.error("Error sending message to Gemini:", err);
            const errorMessage = "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo.";
            setError(errorMessage);
            setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const LoadingIndicator = () => (
        <div className="flex justify-start">
            <div className="p-3 rounded-lg max-w-lg bg-slate-700 text-gray-300 mr-auto rounded-bl-none shadow-md">
                <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></span>
                    </div>
                    <span className="text-sm">NeuroBuddy está pensando...</span>
                </div>
            </div>
        </div>
    );

    const WelcomeMessage = () => (
         <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400 p-8 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 max-w-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0l-2.121 2.121m-2.121-2.121l2.121-2.121" />
                </svg>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">¡Hola! Soy NeuroBuddy.</h3>
                <p className="text-slate-400">Tu asistente experto en los 12 pares craneales. Pregúntame algo como:</p>
                <ul className="list-none text-left mx-auto max-w-sm mt-4 space-y-2 text-sm">
                    <li className="bg-slate-700/50 p-2 rounded-md">"¿Qué función tiene el Nervio Vago?"</li>
                    <li className="bg-slate-700/50 p-2 rounded-md">"¿Cuál es el foramen de salida del Trigémino?"</li>
                    <li className="bg-slate-700/50 p-2 rounded-md">"Lista los nervios puramente motores"</li>
                </ul>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white">
            <header className="p-4 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 shadow-lg flex justify-between items-center z-10">
                <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">NeuroBuddy: Asistente de Pares Craneales</h1>
            </header>

            <main className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isLoading && <WelcomeMessage />}
                {messages.map((msg, index) => (
                    <Message key={index} message={msg} />
                ))}
                {isLoading && <LoadingIndicator />}
                {error && <div className="text-red-400 text-center p-2 bg-red-900/50 rounded-md">{error}</div>}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 bg-slate-900 border-t border-slate-700">
                <form onSubmit={handleSendMessage} className="flex space-x-3 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe tu pregunta sobre los pares craneales..."
                        className="flex-grow p-3 bg-slate-800 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                        disabled={isLoading || !chat}
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-12 h-12"
                        disabled={!input.trim() || isLoading || !chat}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent border-solid rounded-full animate-spin"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default App;
