// In your hooks/webHook.js file
export const useWebhook = () => {
    const sendWebhook = async ({ payload }) => {
        const webhookUrl = import.meta.env.VITE_N8N_UPDATE_URL;

        if (!webhookUrl) {
            throw new Error("Webhook URL is required");
        }

        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(
                    `Webhook failed: ${response.status} ${response.statusText}`
                );
            }

            return { status: "success", message: "Webhook sent successfully" };
        } catch (err) {
            console.error("Webhook error:", err);
            throw err; // Re-throw to see the error in handleSubmit
        }
    };

    return { sendWebhook };
};
