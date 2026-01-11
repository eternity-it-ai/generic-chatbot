const API_BASE_URL =  "https://generic-chatbot-backend-971727032739.europe-west1.run.app";

export async function redeemCode(code: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}/api/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      throw new Error("Too many attempts, wait and try again");
    }

    if (response.status >= 400 && response.status < 500) {
      throw new Error("Invalid or expired code");
    }

    if (response.status >= 500) {
      throw new Error("Server error, try again");
    }

    if (!response.ok) {
      throw new Error("Unexpected error occurred");
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Cannot reach server (timeout)");
    }
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error("Cannot reach server. Please check your internet connection.");
    }
    throw error;
  }
}
