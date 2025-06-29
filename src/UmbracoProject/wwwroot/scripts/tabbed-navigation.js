document.addEventListener("DOMContentLoaded", function () {
    // === TAB NAVIGATION LOGIC ===
    const tabs = document.querySelectorAll(".tab-text-button");
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
        let state = btn.getAttribute("data-state") || getCurrentState();
        
        // Ensure we have valid values
        if (!categoryId) {
            const categoryContent = document.getElementById("policies-category-content");
            if (categoryContent) {
                categoryContent.innerHTML = "<p>Missing category ID. Cannot load policies.</p>";
            }
            return;
        }

        // Convert UNIVERSAL to empty string for the API call
        if (state === "UNIVERSAL") {
            state = "";
        }

        const categoryGrid = document.getElementById("category-grid");
        const categoryContent = document.getElementById("policies-category-content");

        if (categoryGrid) categoryGrid.style.display = "none";
        if (categoryContent) {
            categoryContent.style.display = "block";
            categoryContent.innerHTML = '<p class="loading">Loading policies...</p>';
        }

        const fetchUrl = `/umbraco/api/policies/getcategory?categoryId=${categoryId}&state=${state}`;

        fetch(fetchUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
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

                    // Initialize state selector in the loaded content
                    initCategoryStateSelector();
                }
            })
            .catch((error) => {
                if (categoryContent) {
                    categoryContent.innerHTML = `<p>Error loading policy category: ${error.message}</p>`;
                }
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
    const stateDisplayNames = {
        "CA": "California",
        "IL": "Illinois",
        "UNIVERSAL": "All Locations"
    };

    function getCurrentState() {
        return localStorage.getItem("selectedState") || "UNIVERSAL";
    }

    function updateDisplayedState(state, stateNameElement, changeBtnElement) {
        if (stateNameElement) {
            stateNameElement.textContent = stateDisplayNames[state] || "All Locations";
        }

        // Update all category buttons with the new state
        document.querySelectorAll(".policy-category-btn").forEach(btn => {
            btn.setAttribute("data-state", state);
        });
    }

    function showStateFeedback(message) {
        const stateFeedback = document.getElementById("state-change-feedback");
        if (!stateFeedback) return;
        stateFeedback.textContent = message;
        stateFeedback.style.display = "block";
        setTimeout(() => {
            stateFeedback.style.display = "none";
        }, 1800);
    }

    function initCategoryStateSelector() {
        const stateLabel = document.getElementById("current-state-label");
        const stateName = document.getElementById("current-state-name");
        const changeBtn = document.getElementById("change-state-btn");
        const stateForm = document.getElementById("state-select-form");
        const stateSelector = document.getElementById("state");

        if (!stateLabel || !stateName || !changeBtn || !stateForm || !stateSelector) {
            return;
        }

        // Check if there's a saved state
        const savedState = getCurrentState();
        
        // Initial display logic based on specification
        if (savedState === "UNIVERSAL") {
            // First load, no localStorage or default state - show full dropdown
            stateLabel.style.display = "none";
            stateForm.style.display = "block";
            stateSelector.value = "";
        } else {
            // State is stored - show compact format
            updateDisplayedState(savedState, stateName, changeBtn);
            stateSelector.value = savedState;
            stateLabel.style.display = "block";
            stateForm.style.display = "none";
        }

        // Handle change button click - revert to full dropdown
        changeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            stateLabel.style.display = "none";
            stateForm.style.display = "block";
            stateSelector.focus();
        });

        // Handle state selector change
        stateSelector.addEventListener("change", () => {
            const newState = stateSelector.value || "UNIVERSAL";
            
            // Save to localStorage
            localStorage.setItem("selectedState", newState);

            // Update display
            updateDisplayedState(newState, stateName, changeBtn);

            if (newState === "UNIVERSAL") {
                // Keep showing dropdown for "All Locations" (per specification this stays as dropdown)
                stateLabel.style.display = "none";
                stateForm.style.display = "block";
            } else {
                // Switch to compact format for specific states
                stateLabel.style.display = "block";
                stateForm.style.display = "none";
            }

            // Show confirmation message
            showStateFeedback(`State updated to ${stateDisplayNames[newState] || "All Locations"}.`);

            // Reload the current category with new state
            const categoryContent = document.getElementById("policies-category-content");
            if (categoryContent && categoryContent.style.display === "block") {
                const categoryId = categoryContent.querySelector('[data-category-id]')?.getAttribute('data-category-id');
                if (categoryId) {
                    let apiState = newState === "UNIVERSAL" ? "" : newState;
                    fetch(`/umbraco/api/policies/getcategory?categoryId=${categoryId}&state=${apiState}`)
                        .then(response => response.text())
                        .then(html => {
                            categoryContent.innerHTML = `
                                <button type="button" class="back-to-categories-btn">← Back to categories</button>
                                ${html}
                            `;

                            const backBtn = categoryContent.querySelector(".back-to-categories-btn");
                            if (backBtn) {
                                backBtn.addEventListener("click", function () {
                                    categoryContent.style.display = "none";
                                    const categoryGrid = document.getElementById("category-grid");
                                    if (categoryGrid) categoryGrid.style.display = "grid";
                                    initPolicyCategoryButtons();
                                });
                            }

                            // Re-initialize state selector
                            initCategoryStateSelector();
                        })
                        .catch((error) => {
                            categoryContent.innerHTML = `<p>Error loading policy category: ${error.message}</p>`;
                        });
                }
            }
        });
    }

    // Initialize state selectors when page loads
    setTimeout(() => {
        initCategoryStateSelector();
    }, 100);
    
    // Make sure category buttons have the current state when the page loads
    setTimeout(() => {
        const currentState = getCurrentState();
        updateDisplayedState(currentState);
    }, 200);
});