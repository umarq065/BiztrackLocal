
'use client';

import { useState, useEffect } from 'react';
import clientPromise from '@/lib/mongodb';

// A simple utility to get the collection without needing the service, for a direct test.
async function getClientsCollection() {
    const client = await clientPromise;
    // Explicitly use the database name we expect to exist.
    const db = client.db('biztrack-pro');
    return db.collection('clients');
}

export default function DbTestPage() {
    const [connectionStatus, setConnectionStatus] = useState<string>('Testing connection...');
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [clientCount, setClientCount] = useState<number | null>(null);

    useEffect(() => {
        async function testDbConnection() {
            try {
                const clientsCollection = await getClientsCollection();
                const count = await clientsCollection.countDocuments();
                setClientCount(count);
                setConnectionStatus('Success');
            } catch (error: any) {
                setConnectionStatus('Failed');
                setErrorDetails(error.message || 'An unknown error occurred.');
                console.error("DB Connection Error:", error);
            }
        }
        testDbConnection();
    }, []);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-2xl rounded-lg border bg-white p-8 shadow-md dark:bg-gray-800 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Database Connection Test</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    This page tests the connection to your MongoDB database.
                </p>

                <div className="mt-6">
                    {connectionStatus === 'Testing connection...' && (
                        <div className="flex items-center gap-3 rounded-md bg-blue-100 p-4 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{connectionStatus}</span>
                        </div>
                    )}

                    {connectionStatus === 'Success' && (
                        <div className="rounded-md bg-green-100 p-4 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                            <h2 className="font-semibold">Connection Successful!</h2>
                            <p className="mt-1">
                                The application successfully connected to the <strong>biztrack-pro</strong> database.
                            </p>
                            <p className="mt-1">
                                Found <strong>{clientCount ?? 0}</strong> documents in the 'clients' collection.
                            </p>
                        </div>
                    )}

                    {connectionStatus === 'Failed' && (
                        <div className="rounded-md bg-red-100 p-4 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                            <h2 className="font-semibold">Connection Failed</h2>
                            <p className="mt-2">Could not connect to the database. Please check the following:</p>
                            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                                <li>Is the <strong>`MONGODB_URI`</strong> in your <strong>`.env`</strong> file correct?</li>
                                <li>Is your password URL-encoded if it contains special characters like <strong>`@`</strong>, <strong>`:`</strong>, <strong>`?`</strong>, etc.?</li>
                                <li>Is your current IP address whitelisted in MongoDB Atlas under "Network Access"?</li>
                            </ul>
                            <div className="mt-4">
                                <h3 className="text-sm font-semibold">Error Details:</h3>
                                <pre className="mt-1 whitespace-pre-wrap rounded-md bg-red-200/50 p-2 text-xs font-mono dark:bg-red-950/50">
                                    {errorDetails}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
