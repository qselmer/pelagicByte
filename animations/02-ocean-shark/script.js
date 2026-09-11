document.addEventListener("DOMContentLoaded", function () {
    // Función para crear burbujas
    function createBubbles() {
        const container = document.getElementById("bubbles-container");
        for (let i = 0; i < 8; i++) {
            let bubble = document.createElement("div");
            bubble.classList.add("bubble");
            bubble.style.left = Math.random() * 100 + "vw";
            bubble.style.animationDuration = (Math.random() * 3 + 2) + "s";
            container.appendChild(bubble);

            bubble.addEventListener("animationend", () => {
                bubble.remove();
                createBubbles();
            });
        }
    }

    createBubbles();

    const donationContainer = document.createElement("div");
    donationContainer.id = "donation-container";
    donationContainer.innerHTML = `
        <div id="donation-buttons">
            <a href="https://buymeacoffee.com/r4fish" target="_blank" class="donation-btn coffee">☕ Buy Me a Coffee</a>
            <a href="https://ko-fi.com/r4fish" target="_blank" class="donation-btn kofi">❤️ Support on Ko-fi</a>
            <a href="https://paypal.me/qselmer" target="_blank" class="donation-btn paypal">🤝 Donate via PayPal</a>
        </div>
    `;
    document.body.appendChild(donationContainer);
});
