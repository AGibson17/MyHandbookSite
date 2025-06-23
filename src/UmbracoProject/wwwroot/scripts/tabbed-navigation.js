document.addEventListener("DOMContentLoaded", function () {
    // === TAB NAVIGATION LOGIC ===
    const tabs = document.querySelectorAll(".tab-icon-button");
    const panels = document.querySelectorAll(".tab-panel");

    function activateTab(tabToActivate) {
        if (!tabToActivate) return;

        tabs.forEach(tab => {
            tab.setAttribute("aria-selected", "false");
            tab.setAttribute("tabindex", "-1");
        });

        panels.forEach(panel => {
            panel.hidden = true;
        });

        const targetPanelId = tabToActivate.getAttribute("aria-controls");
        const targetPanel = document.getElementById(targetPanelId);

        tabToActivate.setAttribute("aria-selected", "true");
        tabToActivate.setAttribute("tabindex", "0");
        tabToActivate.focus();

        if (targetPanel) {
            targetPanel.hidden = false;
            const focusable = targetPanel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable) {
                focusable.focus({ preventScroll: true });
            } else {
                targetPanel.setAttribute('tabindex', '-1');
                targetPanel.focus({ preventScroll: true });
            }
        }

        localStorage.setItem("selectedTabId", tabToActivate.id);
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activateTab(tab));
        tab.addEventListener("keydown", event => {
            let newIndex = index;
            switch (event.key) {
                case "ArrowUp":
                    event.preventDefault();
                    newIndex = (index - 1 + tabs.length) % tabs.length;
                    tabs[newIndex].focus();
                    break;
                case "ArrowDown":
                    event.preventDefault();
                    newIndex = (index + 1) % tabs.length;
                    tabs[newIndex].focus();
                    break;
                case "Home":
                    event.preventDefault();
                    tabs[0].focus();
                    break;
                case "End":
                    event.preventDefault();
                    tabs[tabs.length - 1].focus();
                    break;
                case "Enter":
                case " ":
                    event.preventDefault();
                    activateTab(tab);
                    break;
            }
        });
    });

    const savedTabId = localStorage.getItem("selectedTabId");
    const savedTab = savedTabId && document.getElementById(savedTabId);
    activateTab(savedTab || tabs[0]);

    // === CATEGORY PANEL LOADER ===
    function initPolicyCategoryButtons() {
        document.querySelectorAll(".policy-category-btn").forEach(btn => {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                loadCategoryPolicies(btn);
            });
        });
    }

    function loadCategoryPolicies(btn) {
        const categoryId = btn.getAttribute("data-category-id");
        const state = btn.getAttribute("data-state");

        const categoryGrid = document.getElementById("category-grid");
        const categoryContent = document.getElementById("policies-category-content");

        if (categoryGrid) categoryGrid.style.display = "none";
        if (categoryContent) {
            categoryContent.style.display = "block";
            categoryContent.innerHTML = '<p class="loading">Loading policies...</p>';
        }

        fetch(`/umbraco/api/policies/getcategory?categoryId=${categoryId}&state=${state}`)
            .then(response => {
                if (!response.ok) throw new Error("Network error");
                return response.text();
            })
            .then(html => {
                if (categoryContent) {
                    categoryContent.innerHTML = `
                        <button type="button" class="back-to-categories-btn">← Back to categories</button>
                        ${html}
                    `;

                    const backBtn = categoryContent.querySelector(".back-to-categories-btn");
                    if (backBtn) {
                        backBtn.addEventListener("click", function () {
                            categoryContent.style.display = "none";
                            if (categoryGrid) categoryGrid.style.display = "grid";
                            initPolicyCategoryButtons(); // Re-attach handlers
                        });
                    }
                }
            })
            .catch(() => {
                if (categoryContent) categoryContent.innerHTML = "<p>Error loading policy category.</p>";
            });
    }

    initPolicyCategoryButtons();

    // === WELCOME DISMISS ===
    const welcomePanel = document.getElementById("panel-welcome");
    const dismissBtn = document.getElementById("dismiss-welcome");

    if (welcomePanel) {
        if (localStorage.getItem("welcomeDismissed") === "true") {
            document.getElementById("tab-policies")?.click();
        } else {
            welcomePanel.removeAttribute("hidden");
        }
    }

    dismissBtn?.addEventListener("click", () => {
        localStorage.setItem("welcomeDismissed", "true");
        document.getElementById("tab-policies")?.click();
    });

    // === STATE SELECTOR ===
    const stateLabel = document.getElementById("current-state-label");
    const stateName = document.getElementById("current-state-name");
    const changeBtn = document.getElementById("change-state-btn");
    const stateForm = document.getElementById("state-select-form");
    const stateSelector = document.getElementById("state");
    const stickySelector = document.querySelector(".sticky-state-selector");
    let stateChangedOnce = false;

    if (changeBtn && stateForm && stateLabel) {
        changeBtn.addEventListener("click", () => {
            stateLabel.style.display = "none";
            changeBtn.style.display = "none";
            stateForm.style.display = "inline";
            stateSelector.focus();
        });

        stateSelector.addEventListener("change", () => {
            const newState = stateSelector.value || "UNIVERSAL";

            if (stickySelector && !stateChangedOnce) {
                stickySelector.classList.add("animated");
                setTimeout(() => stickySelector.classList.remove("animated"), 1300);
                stateChangedOnce = true;
            }

            stateName.textContent = newState === "CA" ? "California" :
                newState === "IL" ? "Illinois" : "All Locations";

            stateForm.style.display = "none";
            stateLabel.style.display = "inline";
            changeBtn.style.display = "inline";

            document.querySelectorAll(".policy-category-btn").forEach(btn => {
                btn.setAttribute("data-state", newState);
            });

            const categoryContent = document.getElementById("policies-category-content");
            const currentCategoryBtn = document.querySelector(".policy-category-btn[data-active='true']");
            if (categoryContent?.style.display === "block" && currentCategoryBtn) {
                currentCategoryBtn.click();
            }
        });
    }
});
