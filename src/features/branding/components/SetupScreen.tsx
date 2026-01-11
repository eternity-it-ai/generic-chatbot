import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import type { Branding } from "@/shared/types";
import { redeemCode } from "@/shared/api/api";

interface SetupScreenProps {
  onConfigured: (branding: Branding) => void;
  onReset: () => void;
}

export default function SetupScreen({ onConfigured, onReset }: SetupScreenProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().trim();
    // Optional: auto-insert dash if user is typing a long code
    // Assuming format XXXX-XXXX
    if (value.length === 4 && !value.includes("-")) {
      // value = value + "-"; // This can be annoying, let's just let them type
    }
    setCode(value);
    setError(null);
  };

  const handleActivate = async () => {
    if (!code) {
      setError("Please enter a setup code.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await redeemCode(code);
      
      // Derive logo from domain
      const cleanDomain = res.payload.companyDomain
        .replace("https://", "")
        .replace("http://", "")
        .split("/")[0];
      const derivedLogoUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;

        
      // Download logo locally
      let finalLogoUrl = derivedLogoUrl;
      try {
        const localDataUrl = await invoke<string>("download_logo", { url: derivedLogoUrl });
        finalLogoUrl = localDataUrl;
      } catch (e) {
        console.error("Failed to download logo locally:", e);
      }

      const brandingData: Branding = {
        brandVersion: 1,
        configured: true,
        configuredAt: new Date().toISOString(),
        payload: {
          ...res.payload,
          logoUrl: finalLogoUrl
        }
      };

      await invoke("save_branding", { brandingJson: JSON.stringify(brandingData) });
      onConfigured(brandingData);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">One-time Setup</CardTitle>
          <CardDescription>
            Please enter your setup code to activate the application. 
            This code was provided in your welcome email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="A7K9-P3QF"
              value={code}
              onChange={handleCodeChange}
              disabled={isLoading}
              className="text-lg tracking-widest text-center"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Activation Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleActivate}
            disabled={isLoading || !code}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activating...
              </>
            ) : "Activate"}
          </Button>
          
          <div className="flex w-full gap-2 mt-2">
             <Button 
                variant="ghost" 
                className="flex-1 text-xs text-muted-foreground"
                onClick={onReset}
                disabled={isLoading}
             >
               Reset App
             </Button>
             <Button 
                variant="ghost" 
                className="flex-1 text-xs text-muted-foreground"
                onClick={() => window.location.reload()}
                disabled={isLoading}
             >
               Try Again
             </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
