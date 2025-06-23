document.addEventListener("DOMContentLoaded", function () {
    // Toggle policy accordion
    document.body.addEventListener("click", function (e) {
        const btn = e.target.closest('button[data-action="toggle-policy"]');
        if (!btn) return;

        const targetId = btn.getAttribute('data-target');
        const content = document.getElementById(targetId);
        const expanded = btn.getAttribute("aria-expanded") === "true";

        btn.setAttribute("aria-expanded", (!expanded).toString());

        if (content) {
            content.hidden = expanded;
        }
    });

    // Keyboard support
    document.body.addEventListener("keydown", function (e) {
        const btn = e.target.closest('button[data-action="toggle-policy"]');
        if (!btn) return;

        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            btn.click();
        }
    });
});
