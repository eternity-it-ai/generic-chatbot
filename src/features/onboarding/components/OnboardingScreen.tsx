import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Sparkles, Upload, Wand2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import ModelSelect from "@/features/settings/components/ModelSelect";

interface OnboardingScreenProps {
  apiKey: string;
  rememberKey: boolean;
  model: string;
  onApiKeyChange: (key: string) => void;
  onRememberKeyChange: (remember: boolean) => void;
  onModelChange: (model: string) => void;
  onTest: (args: { apiKey: string; model: string }) => Promise<void>;
  onContinue: () => void;
}

function isGeminiModel(model: string): boolean {
  return model.toLowerCase().startsWith("gemini");
}

export default function OnboardingScreen({
  apiKey,
  rememberKey,
  model,
  onApiKeyChange,
  onRememberKeyChange,
  onModelChange,
  onTest,
  onContinue,
}: OnboardingScreenProps) {
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerHint = useMemo(() => {
    if (isGeminiModel(model)) {
      return "Using a Gemini model. Paste your Google API key.";
    }
    return "Using an OpenAI model. Paste your OpenAI API key.";
  }, [model]);

  const handleTest = async (): Promise<boolean> => {
    if (!apiKey.trim()) {
      setError("Please enter an API key to continue.");
      setTestSuccess(false);
      return false;
    }

    setIsTesting(true);
    setError(null);
    setTestSuccess(false);
    try {
      await onTest({ apiKey, model });
      setTestSuccess(true);
      return true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Validation failed. Please try again.";
      setError(message);
      setTestSuccess(false);
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const handleContinue = async () => {
    // Prefer correctness: try validating once if the user never pressed Test.
    const ok = testSuccess || (await handleTest());
    if (!ok) return;
    onContinue();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(1200px_circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_60%),radial-gradient(900px_circle_at_80%_30%,hsl(var(--chart-2)/0.12),transparent_55%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)))]">
      <div className="w-full max-w-3xl">
        <Card className="overflow-hidden shadow-xl border-border/60">
          <div className="grid md:grid-cols-5">
            <div className="md:col-span-2 p-8 bg-[linear-gradient(135deg,hsl(var(--primary)/0.08),transparent_55%)]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Welcome</span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                Let’s get you ready in under a minute.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Configure your model + API key once, then start analyzing your data.
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md border border-border/60 bg-background p-2">
                      <Upload className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">1) Upload your CSV</p>
                      <p className="text-xs text-muted-foreground">
                        Drop in a dataset to begin.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md border border-border/60 bg-background p-2">
                      <Wand2 className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">2) AI builds a quick model</p>
                      <p className="text-xs text-muted-foreground">
                        It generates a “business logic”/metadata summary (LLM call).
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md border border-border/60 bg-background p-2">
                      <Sparkles className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">3) Ask questions</p>
                      <p className="text-xs text-muted-foreground">
                        The AI answers based on your uploaded data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl">Onboarding</CardTitle>
              </CardHeader>

              <CardContent className="p-8 pt-0 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="model">What model are you using?</Label>
                  <div id="model">
                    <ModelSelect value={model} onChange={(m) => {
                      onModelChange(m);
                      setError(null);
                      setTestSuccess(false);
                    }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="apiKey">API key</Label>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowKey((v) => !v)}
                    >
                      {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showKey ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="apiKey"
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => {
                        onApiKeyChange(e.target.value);
                        setError(null);
                        setTestSuccess(false);
                      }}
                      placeholder={isGeminiModel(model) ? "AIzaSy..." : "sk-..."}
                      className="pl-10"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{providerHint}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="rememberKey"
                      checked={rememberKey}
                      onCheckedChange={(v) => onRememberKeyChange(Boolean(v))}
                    />
                    <Label htmlFor="rememberKey" className="text-sm font-normal">
                      Remember API key on this device
                    </Label>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Couldn’t validate</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {testSuccess && (
                  <Alert>
                    <AlertTitle>Looks good</AlertTitle>
                    <AlertDescription>Your key works with the selected model.</AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={isTesting || !apiKey.trim()}
                  className="w-full sm:w-auto"
                >
                  {isTesting ? "Testing..." : "Test"}
                </Button>

                <Button
                  type="button"
                  onClick={handleContinue}
                  disabled={isTesting || !apiKey.trim()}
                  className="w-full sm:w-auto"
                >
                  Continue
                </Button>
              </CardFooter>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

