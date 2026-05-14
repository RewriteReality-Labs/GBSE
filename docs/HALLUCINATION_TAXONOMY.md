# GBSE Hallucination Taxonomy v1.0

The four tags used by the Hostile Auditor. This taxonomy is fixed. Changes require an RFC.

---

## [HALLUCINATION]

**Definition:** A factual claim that cannot be verified from context or public knowledge.

**Required action:** Remove entirely. No softening. No replacement with speculation.

**Examples of what triggers this tag:**
- Specific statistics without a citable source ("studies show 73% of users…")
- Named entities that do not exist or are incorrectly attributed
- Events that did not occur or are misattributed in date/place/actor
- Technical specifications that are fabricated or incorrect

**What does NOT trigger this tag:**
- Claims labeled `[DEBATABLE]` by the Solver (those are handled by `[UNVERIFIED]`)
- Claims that are genuinely contested — those are `[UNVERIFIED]`
- Logical gaps — those are `[GAP]`

---

## [FLUFF]

**Definition:** Generic filler language that adds zero informational value.

**Required action:** Remove entirely.

**Examples of what triggers this tag:**
- "It is important to note that…"
- "In conclusion, it goes without saying…"
- "This is a complex topic with many nuances…"
- "Experts generally agree that…" (without naming which experts or which claim)
- Transitional padding that restates the question before answering it

**What does NOT trigger this tag:**
- Introductory framing that is genuinely necessary for context
- Summary statements that synthesize specific, named claims

---

## [GAP]

**Definition:** A logical leap, unstated assumption, or missing reasoning step.

**Required action:** Fill with concrete specifics. No vague placeholders.

**Examples of what triggers this tag:**
- "Therefore, X is true" without establishing the causal chain from premises to X
- A conclusion that depends on an assumption never stated
- A recommendation without the reasoning connecting evidence to recommendation
- "This leads to Y" when the mechanism by which this happens is not explained

**What does NOT trigger this tag:**
- Standard domain conventions that an expert audience would accept without elaboration
- Claims that are simply unverified (those are `[UNVERIFIED]`)

---

## [UNVERIFIED]

**Definition:** A claim that may be correct but cannot be confirmed within this pipeline run.

**Required action:** Label as `[DEBATABLE]` in the final output. Do not remove.

**Examples of what triggers this tag:**
- The Solver's own `[DEBATABLE]` labels (confirm and propagate them)
- Contested empirical claims where evidence exists on both sides
- Claims that are likely correct but depend on information the pipeline cannot access
- Forward-looking claims or predictions

**What does NOT trigger this tag:**
- Claims that are clearly false (those are `[HALLUCINATION]`)
- Claims that are verifiably true from public knowledge

---

## Tag Precedence

When multiple tags could apply, use this order:

1. `[HALLUCINATION]` — removes the claim (highest priority)
2. `[GAP]` — fills the missing reasoning
3. `[FLUFF]` — removes the filler
4. `[UNVERIFIED]` — labels the uncertainty (lowest priority)

If a claim is both hallucinated and fluff, tag it `[HALLUCINATION]` — the removal action covers both.
