// ============================================================
// Change Enablement Agent — Logic
// Based on ITIL 4 Change Enablement (SKILL.md)
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    // ---------------------------------------------------------
    // DOM References
    // ---------------------------------------------------------
    var form               = document.getElementById("change-form");
    var resultsSection     = document.getElementById("results-section");
    var classificationBadge = document.getElementById("classification-badge");
    var classificationDesc = document.getElementById("classification-description");
    var riskAssessmentCard = document.getElementById("risk-assessment");
    var calculateRiskBtn   = document.getElementById("calculate-risk-btn");
    var riskScoreResult    = document.getElementById("risk-score-result");
    var compositeScoreEl   = document.getElementById("composite-score");
    var riskTierBadge      = document.getElementById("risk-tier-badge");
    var approvalFlowEl     = document.getElementById("approval-flow");
    var approvalPathCard   = document.getElementById("approval-path");
    var mitigationCard     = document.getElementById("mitigation-checklist");
    var resetBtn           = document.getElementById("reset-btn");
    var sliders            = document.querySelectorAll(".risk-slider");

    // ---------------------------------------------------------
    // State
    // ---------------------------------------------------------
    var currentClassification = "";
    var currentRiskTier       = "";

    // ==========================================================
    // 1. classifyChange(serviceDown, preApproved)
    //    Section 1.3 — Classification Decision Tree
    //
    //    Is service currently down or critically degraded?
    //    ├─ YES → EMERGENCY
    //    └─ NO  → Is this a pre-approved change model?
    //              ├─ YES → STANDARD
    //              └─ NO  → NORMAL (assess risk tier below)
    // ==========================================================

    function classifyChange(serviceDown, preApproved) {
        if (serviceDown === "yes") {
            return "Emergency";
        }
        if (preApproved === "yes") {
            return "Standard";
        }
        return "Normal";
    }

    // Helper: return badge class + human-readable description
    function getClassificationDetails(classification) {
        switch (classification) {
            case "Standard":
                return {
                    badgeClass: "badge-standard",
                    description:
                        "Standard Change \u2014 Pre-authorized, low-risk, and repeatable. " +
                        "No additional approval is needed at request time (pre-approved " +
                        "via change model). Lead time target: minutes to hours via " +
                        "automated pipeline. Documentation: minimal log entry only."
                };
            case "Normal":
                return {
                    badgeClass: "badge-normal",
                    description:
                        "Normal Change \u2014 Requires assessment, authorization, and scheduling. " +
                        "Use the risk dimension sliders below to score each dimension 1\u20135 " +
                        "and determine the risk tier and approval path. " +
                        "Lead time target: 1\u20135 business days depending on risk tier."
                };
            case "Emergency":
                return {
                    badgeClass: "badge-emergency",
                    description:
                        "Emergency Change \u2014 Must be implemented immediately to restore " +
                        "service or prevent imminent critical impact. Requires expedited " +
                        "ECAB (Emergency CAB) approval. Full documentation must be " +
                        "completed within 48 hours after implementation. A corresponding " +
                        "incident or problem record is required."
                };
            default:
                return { badgeClass: "", description: "" };
        }
    }

    // ==========================================================
    // 2. assessRisk(scores)
    //    Section 2.1 — 7 Risk Dimensions (each 1–5)
    //    Section 2.2 — Composite Score & Risk Tier
    //
    //    Dimensions:
    //      1. Impact scope
    //      2. Complexity
    //      3. Reversibility
    //      4. Testing confidence
    //      5. Deployment history
    //      6. Timing sensitivity
    //      7. Dependency count
    //
    //    risk_score = sum(all_dimensions) / number_of_dimensions
    //
    //    | Composite Score | Risk Tier |
    //    |-----------------|-----------|
    //    | 1.0 – 2.0      | Low       |
    //    | 2.1 – 3.5      | Medium    |
    //    | 3.6 – 5.0      | High      |
    // ==========================================================

    function assessRisk(scores) {
        var total = 0;
        for (var i = 0; i < scores.length; i++) {
            total += scores[i];
        }
        var compositeScore = total / scores.length;

        var tier;
        if (compositeScore <= 2.0) {
            tier = "Low";
        } else if (compositeScore <= 3.5) {
            tier = "Medium";
        } else {
            tier = "High";
        }

        return {
            compositeScore: compositeScore,
            riskTier: tier
        };
    }

    // Helper: read current slider values into an array
    function getSliderScores() {
        var scores = [];
        sliders.forEach(function (slider) {
            scores.push(parseInt(slider.value, 10));
        });
        return scores;
    }

    // Helper: badge class for a risk tier
    function getTierBadgeClass(tier) {
        switch (tier) {
            case "Low":    return "badge-low";
            case "Medium": return "badge-medium";
            case "High":   return "badge-high";
            default:       return "";
        }
    }

    // ==========================================================
    // 3. getApprovalPath(classification, riskTier)
    //    Section 4 — Approval Workflows
    //
    //    Returns an object with:
    //      .title  — short label for the workflow
    //      .steps  — ordered array of step descriptions
    //
    //    Workflows (from SKILL.md Section 4):
    //      4.1  Standard Change Flow
    //      4.2  Normal Change Flow — Low Risk
    //      4.3  Normal Change Flow — Medium Risk
    //      4.4  Normal Change Flow — High Risk
    //      4.5  Emergency Change Flow
    // ==========================================================

    function getApprovalPath(classification, riskTier) {
        switch (classification) {

            // Section 4.1 — Standard Change Flow
            case "Standard":
                return {
                    title: "Standard Change Flow (Section 4.1)",
                    steps: [
                        "Requester triggers pipeline",
                        "Automated pre-checks (lint, test, scan)",
                        "Auto-approved (change model match verified)",
                        "Deploy",
                        "Automated validation",
                        "Change record logged automatically"
                    ]
                };

            // Section 4.5 — Emergency Change Flow
            case "Emergency":
                return {
                    title: "Emergency Change Flow (Section 4.5)",
                    steps: [
                        "Incident declared",
                        "Emergency RFC created (minimal fields)",
                        "ECAB approval (phone/chat, 2 approvers minimum)",
                        "Implement immediately",
                        "Validate service restored",
                        "Retrospective RFC completion (within 48h)",
                        "Mandatory PIR"
                    ]
                };

            // Section 4.2 / 4.3 / 4.4 — Normal Change Flows by risk tier
            case "Normal":
                switch (riskTier) {

                    // Section 4.2 — Normal (Low Risk)
                    case "Low":
                        return {
                            title: "Normal Change Flow \u2014 Low Risk (Section 4.2)",
                            steps: [
                                "Requester submits RFC",
                                "Automated risk scoring",
                                "Peer review (1 reviewer, async)",
                                "Approved \u2192 Scheduled in change calendar",
                                "Deploy in approved window",
                                "Validation",
                                "Close RFC"
                            ]
                        };

                    // Section 4.3 — Normal (Medium Risk)
                    case "Medium":
                        return {
                            title: "Normal Change Flow \u2014 Medium Risk (Section 4.3)",
                            steps: [
                                "Requester submits RFC",
                                "Automated risk scoring",
                                "Technical review (architect or senior engineer)",
                                "Change authority approval",
                                "Scheduled in change calendar (with conflict check)",
                                "Deploy with monitoring",
                                "Validation + brief PIR",
                                "Close RFC"
                            ]
                        };

                    // Section 4.4 — Normal (High Risk)
                    case "High":
                        return {
                            title: "Normal Change Flow \u2014 High Risk (Section 4.4)",
                            steps: [
                                "Requester submits RFC",
                                "Automated risk scoring",
                                "Technical review + security review",
                                "Pre-CAB: documentation completeness check",
                                "CAB review (weekly cadence or ad-hoc)",
                                "Senior management sign-off",
                                "Scheduled with communication plan",
                                "Deploy with war-room / bridge call",
                                "Validation + full PIR",
                                "Close RFC"
                            ]
                        };

                    default:
                        return { title: "", steps: [] };
                }

            default:
                return { title: "", steps: [] };
        }
    }

    // ---------------------------------------------------------
    // Rendering helpers
    // ---------------------------------------------------------

    function renderApprovalFlow(approvalPath) {
        approvalFlowEl.innerHTML = "";

        // Title above the steps
        if (approvalPath.title) {
            var titleEl = document.createElement("p");
            titleEl.style.fontWeight = "600";
            titleEl.style.marginBottom = "0.6rem";
            titleEl.style.color = "#0f3460";
            titleEl.textContent = approvalPath.title;
            approvalFlowEl.appendChild(titleEl);
        }

        approvalPath.steps.forEach(function (step, index) {
            var stepDiv = document.createElement("div");
            stepDiv.className = "approval-step";
            stepDiv.innerHTML =
                '<span class="step-icon">&#9654;</span>' +
                '<span class="step-text">' + step + '</span>';
            approvalFlowEl.appendChild(stepDiv);

            // Arrow between steps (not after the last one)
            if (index < approvalPath.steps.length - 1) {
                var arrowDiv = document.createElement("div");
                arrowDiv.className = "arrow-down";
                arrowDiv.textContent = "\u2193";
                approvalFlowEl.appendChild(arrowDiv);
            }
        });
    }

    function resetCheckboxes() {
        var boxes = mitigationCard.querySelectorAll('input[type="checkbox"]');
        boxes.forEach(function (cb) { cb.checked = false; });
    }

    // ==========================================================
    // EVENT: Form submission — classify the change
    // ==========================================================

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        var serviceDownEl = document.querySelector('input[name="serviceDown"]:checked');
        var preApprovedEl = document.querySelector('input[name="preApproved"]:checked');

        // Guard: both radio groups must be answered
        if (!serviceDownEl || !preApprovedEl) {
            return;
        }

        // --- Classify ---
        currentClassification = classifyChange(serviceDownEl.value, preApprovedEl.value);
        var details = getClassificationDetails(currentClassification);

        // Display classification badge + description
        classificationBadge.textContent = currentClassification;
        classificationBadge.className = "badge " + details.badgeClass;
        classificationDesc.textContent = details.description;

        // --- Branch on classification type ---
        if (currentClassification === "Normal") {
            // Show risk sliders, hide score until calculated
            riskAssessmentCard.classList.remove("hidden");
            riskScoreResult.classList.add("hidden");

            // Reset sliders to 1
            sliders.forEach(function (slider) {
                slider.value = 1;
                var id = "value-" + slider.dataset.dimension;
                document.getElementById(id).textContent = "1";
            });

            // Hide approval path & checklist until risk is assessed
            approvalPathCard.classList.add("hidden");
            mitigationCard.classList.add("hidden");
            resetCheckboxes();

        } else {
            // Standard or Emergency — no risk sliders needed
            riskAssessmentCard.classList.add("hidden");
            riskScoreResult.classList.add("hidden");

            // Show approval path directly
            var path = getApprovalPath(currentClassification, "");
            renderApprovalFlow(path);
            approvalPathCard.classList.remove("hidden");

            // Show mitigation checklist
            resetCheckboxes();
            mitigationCard.classList.remove("hidden");
        }

        // Show results section and scroll to it
        resultsSection.classList.remove("hidden");
        resultsSection.scrollIntoView({ behavior: "smooth" });
    });

    // ==========================================================
    // EVENT: Slider live value display
    // ==========================================================

    sliders.forEach(function (slider) {
        slider.addEventListener("input", function () {
            var id = "value-" + this.dataset.dimension;
            document.getElementById(id).textContent = this.value;
        });
    });

    // ==========================================================
    // EVENT: Calculate Risk Score (Assess Risk button)
    // ==========================================================

    calculateRiskBtn.addEventListener("click", function () {
        // Gather scores from the 7 sliders
        var scores = getSliderScores();

        // Compute composite score and risk tier
        var result = assessRisk(scores);
        currentRiskTier = result.riskTier;

        // Display composite score and tier badge
        compositeScoreEl.textContent = result.compositeScore.toFixed(2);
        riskTierBadge.textContent = result.riskTier;
        riskTierBadge.className = "badge " + getTierBadgeClass(result.riskTier);
        riskScoreResult.classList.remove("hidden");

        // Show approval path for the computed risk tier
        var path = getApprovalPath("Normal", result.riskTier);
        renderApprovalFlow(path);
        approvalPathCard.classList.remove("hidden");

        // Show mitigation checklist
        resetCheckboxes();
        mitigationCard.classList.remove("hidden");

        // Scroll to the score result
        riskScoreResult.scrollIntoView({ behavior: "smooth" });
    });

    // ==========================================================
    // EVENT: Reset / Start Over
    // ==========================================================

    resetBtn.addEventListener("click", function () {
        form.reset();
        resultsSection.classList.add("hidden");
        riskAssessmentCard.classList.add("hidden");
        riskScoreResult.classList.add("hidden");
        approvalPathCard.classList.remove("hidden");
        mitigationCard.classList.remove("hidden");
        resetCheckboxes();
        currentClassification = "";
        currentRiskTier = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

});
