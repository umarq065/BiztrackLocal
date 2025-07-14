
import clientPromise from '@/lib/mongodb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

async function testDbConnection() {
  try {
    const client = await clientPromise;
    // Explicitly connect to the "biztrack-pro" database
    const db = client.db("biztrack-pro"); 
    const clientsCollection = db.collection('clients');
    const count = await clientsCollection.countDocuments();
    return { success: true, count };
  } catch (error: any) {
    console.error("Database connection failed:", error);
    // Sanitize the error message for display
    let errorMessage = "An unknown error occurred.";
    if (error.message) {
        if (error.message.includes('bad auth')) {
            errorMessage = "Authentication failed. Please double-check your username and password in the .env file. Ensure the password is URL-encoded if it contains special characters.";
        } else if (error.message.includes('querySrv ESERVFAIL') || error.message.includes('querySrv ENODATA')) {
            errorMessage = "Could not resolve the hostname. Please check if the cluster URL is correct in your .env file and that your network allows connections to MongoDB Atlas.";
        } else if (error.message.includes('access from your IP address')) {
            errorMessage = "Access from your IP address is not allowed. Please ensure your current IP address is whitelisted in your MongoDB Atlas cluster's Network Access settings.";
        } else {
            errorMessage = error.message;
        }
    }
    return { success: false, error: errorMessage };
  }
}

export default async function DbTestPage() {
  const { success, count, error } = await testDbConnection();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
          <CardDescription>
            This page tests the connection to your MongoDB database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert variant="default" className="border-green-500 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200 [&>svg]:text-green-600">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Connection Successful!</AlertTitle>
              <AlertDescription>
                <p>Successfully connected to the database.</p>
                <p className="mt-2 font-semibold">Found {count} documents in the 'clients' collection.</p>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>
                <p>Could not connect to the database. Please check the following:</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                    <li>Is the `MONGODB_URI` in your `.env` file correct?</li>
                    <li>Is your password URL-encoded if it contains special characters like `@`, `:`, `?`, etc.?</li>
                    <li>Is your current IP address whitelisted in MongoDB Atlas under "Network Access"?</li>
                </ul>
                <p className="mt-4 font-mono bg-muted p-2 rounded-md text-destructive-foreground">
                  <strong>Error Details:</strong> {error}
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
