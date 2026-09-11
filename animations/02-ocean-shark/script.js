document.addEventListener("DOMContentLoaded", function () {
  // Función para crear burbujas
  function createBubbles() {
    const container = document.getElementById("bubbles-container");
    for (let i = 0; i < 8; i++) {
      let bubble = document.createElement("div");
      bubble.classList.add("bubble");
      bubble.style.left = Math.random() * 100 + "vw";
      bubble.style.animationDuration = Math.random() * 3 + 2 + "s";
      container.appendChild(bubble);

      bubble.addEventListener("animationend", () => {
        bubble.remove();
        createBubbles();
      });
    }
  }

  createBubbles();

});
