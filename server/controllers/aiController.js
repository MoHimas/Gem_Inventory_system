const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db'); // Assuming 'db' is the PostgreSQL client/pool

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate a specific AI Insight based on the requested ID
exports.getSpecificInsight = async (req, res) => {
    try {
        const { type } = req.body;

        if (!type) {
            return res.status(400).json({ error: "Insight 'type' is required." });
        }
        const userId = req.user.id;

        // 1. Determine which DB data to gather and what the specific goal is based on the type
        let analysisType = "";
        let specificGoal = "";
        let contextDataObj = {};
        const { rows: testData } = await db.query(`SELECT 1 FROM gemstones WHERE user_id = $1 LIMIT 1`, [userId]);

        if (testData.length === 0) {
            return res.status(404).json({ error: 'NO_DATA', details: 'No active inventory found for analysis.' });
        }

        switch (type) {
            case 'velocity':
                analysisType = "Capital Efficiency (Cash Flow Decisions)";
                specificGoal = "Analyze the fastest moving attribute combinations (shape, type, color) over the last 60 days. Provide a clear decision stating what exact attributes to allocate budget towards to keep cash moving fast.";
                const { rows: velocityData } = await db.query(`
                    SELECT 
                        LOWER(g.cut) as shape,
                        LOWER(g.type) as stone_type,
                        LOWER(g.color) as color,
                        ROUND(AVG(EXTRACT(DAY FROM (s.sale_date - COALESCE(g.purchase_date, g.created_at))))::numeric, 1) as avg_days_to_sell,
                        COUNT(s.id) as total_sold
                    FROM sales s
                    JOIN gemstones g ON s.gemstone_id = g.id
                    WHERE s.user_id = $1 AND s.sale_date >= NOW() - INTERVAL '60 days'
                    GROUP BY LOWER(g.cut), LOWER(g.type), LOWER(g.color)
                    HAVING COUNT(s.id) >= 1
                    ORDER BY avg_days_to_sell ASC
                    LIMIT 5
                `, [userId]);
                contextDataObj = { fastest_selling_patterns: velocityData };
                break;

            case 'dead_stock':
                analysisType = "Capital Efficiency (Cash Flow Decisions)";
                specificGoal = "Identify high-value gems in stock for over 45 days. Provide a specific liquidation decision (e.g., private viewing, trade discount) to free up the locked capital and reinvest in faster-moving stones.";
                const { rows: deadStockData } = await db.query(`
                    SELECT 
                        g.sku,
                        g.type as stone_type,
                        g.carat as weight,
                        g.cut as shape,
                        g.total_price as cost_locked,
                        EXTRACT(DAY FROM (NOW() - COALESCE(g.purchase_date, g.created_at))) as days_in_stock
                    FROM gemstones g
                    LEFT JOIN sales s ON g.id = s.gemstone_id
                    WHERE g.user_id = $1 AND s.id IS NULL AND COALESCE(g.purchase_date, g.created_at) < NOW() - INTERVAL '45 days'
                    ORDER BY cost_locked DESC
                    LIMIT 3
                `, [userId]);
                contextDataObj = { stagnant_high_value_stock: deadStockData };
                break;

            case 'matched_pair':
                analysisType = "Artisan Value-Add (Gemstone Improvements)";
                specificGoal = "Find two stones with similar shape, type, color, clarity, and weight. Suggest bundling them as a 'Matched Pair' for earrings with a recommended % price increase over individual values.";
                const { rows: matchData } = await db.query(`
                    WITH UnsoldStones AS (
                        SELECT g.sku, LOWER(g.type) as stone_type, 
                               COALESCE(LOWER(g.cut), 'natural') as shape, 
                               COALESCE(LOWER(g.color), 'n/a') as color, 
                               COALESCE(LOWER(g.clarity), 'eye-clean') as clarity, 
                               g.carat, g.total_price as cost
                        FROM gemstones g
                        LEFT JOIN sales s ON g.id = s.gemstone_id
                        WHERE g.user_id = $1 AND s.id IS NULL
                    )
                    SELECT a.sku as sku1, b.sku as sku2, a.stone_type, a.shape, a.color, a.clarity, a.carat as carat1, b.carat as carat2
                    FROM UnsoldStones a
                    JOIN UnsoldStones b ON a.stone_type = b.stone_type 
                        AND a.shape = b.shape 
                        AND a.color = b.color 
                        AND a.clarity = b.clarity
                        AND a.sku < b.sku
                    WHERE ABS(a.carat - b.carat) <= 0.2
                    LIMIT 2
                `, [userId]);
                contextDataObj = { potential_matched_pairs: matchData };
                break;

            case 'recutting':
                analysisType = "Artisan Value-Add (Gemstone Improvements)";
                specificGoal = "Identify stones that have high color/clarity but have been unsold for over 30 days. Suggest sending them to a lapidary for a precision recut to improve brilliance, noting that weight loss is offset by price-per-carat increase.";
                const { rows: recutData } = await db.query(`
                    SELECT 
                        g.sku, LOWER(g.type) as stone_type, g.carat as weight, LOWER(g.cut) as shape, LOWER(g.color) as color, LOWER(g.clarity) as clarity,
                        EXTRACT(DAY FROM (NOW() - COALESCE(g.purchase_date, g.created_at))) as days_in_stock
                    FROM gemstones g
                    LEFT JOIN sales s ON g.id = s.gemstone_id
                    WHERE g.user_id = $1 AND s.id IS NULL 
                      AND COALESCE(g.purchase_date, g.created_at) < NOW() - INTERVAL '40 days'
                      AND LOWER(g.clarity) IN ('fl', 'if', 'vvs1', 'vvs2', 'vvs')
                    ORDER BY g.carat DESC
                    LIMIT 2
                `, [userId]);
                contextDataObj = { candidates_for_recutting: recutData };
                break;

            case 'clarity_roi':
                analysisType = "Market Trend Alignment (Procurement Strategy)";
                specificGoal = "Analyze profit margins based on clarity grades. Compare the ROI of Flawless vs lower grades (like VS1) and make a sourcing decision to maximize Return on Investment.";
                const { rows: clarityData } = await db.query(`
                    SELECT 
                        LOWER(g.clarity) as clarity,
                        COUNT(s.id) as total_sold,
                        ROUND(AVG(s.total_price - (s.quantity * COALESCE(g.price_per_carat, 0)))::numeric, 2) as avg_profit_margin
                    FROM sales s
                    JOIN gemstones g ON s.gemstone_id = g.id
                    WHERE s.user_id = $1
                    GROUP BY LOWER(g.clarity)
                    HAVING COUNT(s.id) > 0
                    ORDER BY avg_profit_margin DESC
                `, [userId]);
                contextDataObj = { profitability_by_clarity: clarityData };
                break;

            case 'hue_shift':
                analysisType = "Market Trend Alignment (Procurement Strategy)";
                specificGoal = "Evaluate the current color distribution of unsold stock against recently sold color trends. Suggest which exact color families to acquire to meet current demand.";
                const { rows: soldHues } = await db.query(`
                    SELECT LOWER(g.color) as color, COUNT(s.id) as sold_count
                    FROM sales s JOIN gemstones g ON s.gemstone_id = g.id
                    WHERE s.user_id = $1 AND s.sale_date >= NOW() - INTERVAL '60 days'
                    GROUP BY LOWER(g.color) ORDER BY sold_count DESC LIMIT 3
                `, [userId]);
                const { rows: stockHues } = await db.query(`
                    SELECT LOWER(g.color) as color, COUNT(g.id) as in_stock_count
                    FROM gemstones g LEFT JOIN sales s ON g.id = s.gemstone_id
                    WHERE g.user_id = $1 AND s.id IS NULL
                    GROUP BY LOWER(g.color) ORDER BY in_stock_count DESC LIMIT 3
                `, [userId]);
                contextDataObj = { recent_trending_sold_colors: soldHues, currently_overstocked_colors: stockHues };
                break;

            case 'concentration':
                analysisType = "Risk & Resilience (Stability Decisions)";
                specificGoal = "Calculate financial exposure to the single most dominant gemstone type in inventory. Recommend specific semi-precious or alternative varieties to diversify the next purchases.";
                const { rows: concentrationData } = await db.query(`
                    SELECT 
                        LOWER(g.type) as stone_type,
                        SUM(COALESCE(g.total_price, 0)) as total_value_locked,
                        ROUND((SUM(COALESCE(g.total_price, 0)) / NULLIF((SELECT SUM(COALESCE(g2.total_price, 0)) FROM gemstones g2 LEFT JOIN sales s2 ON g2.id = s2.gemstone_id WHERE g2.user_id = $1 AND s2.id IS NULL), 0) * 100)::numeric, 2) as percentage_of_portfolio
                    FROM gemstones g
                    LEFT JOIN sales s ON g.id = s.gemstone_id
                    WHERE g.user_id = $1 AND s.id IS NULL AND g.total_price IS NOT NULL
                    GROUP BY LOWER(g.type)
                    ORDER BY total_value_locked DESC NULLS LAST
                    LIMIT 2
                `, [userId]);
                contextDataObj = { portfolio_concentration_risk: concentrationData };
                break;

            case 'supplier_reliability':
                analysisType = "Risk & Resilience (Stability Decisions)";
                specificGoal = "Compare suppliers by the amount of dead stock they yield. Suggest pivoting sourcing volume away from the riskiest supplier towards the safest one.";
                const { rows: supplierData } = await db.query(`
                    SELECT 
                        sup.name as supplier,
                        COUNT(g.id) as total_bought,
                        SUM(CASE WHEN s.id IS NULL AND COALESCE(g.purchase_date, g.created_at) < NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as dead_stock_count
                    FROM suppliers sup
                    JOIN gemstones g ON sup.id = g.supplier_id
                    LEFT JOIN sales s ON g.id = s.gemstone_id
                    WHERE g.user_id = $1
                    GROUP BY sup.name
                    HAVING COUNT(g.id) >= 1
                `, [userId]);
                contextDataObj = { deadstock_rates_by_supplier: supplierData };
                break;

            case 'receivables_risk':
                analysisType = "Financial Liquidity (Payments & Cash Flow)";
                specificGoal = "Analyze outstanding customer balances. Identify customers who owe the most and how long the debt has been aging. Recommend a 'Payment Incentive' or 'Collection Priority' based on the risk level.";
                const { rows: receivablesData } = await db.query(`
                    SELECT 
                        c.name as customer_name, 
                        SUM(s.total_price - s.paid_amount) as outstanding_balance,
                        COUNT(s.id) as total_unpaid_invoices,
                        EXTRACT(DAY FROM (NOW() - MIN(s.sale_date))) as carliest_unpaid_days
                    FROM sales s
                    JOIN customers c ON s.customer_id = c.id
                    WHERE s.user_id = $1 AND s.payment_status != 'Paid'
                    GROUP BY c.name
                    HAVING SUM(s.total_price - s.paid_amount) > 0
                    ORDER BY outstanding_balance DESC
                    LIMIT 3
                `, [userId]);
                contextDataObj = { customer_receivables_aging: receivablesData };
                break;

            case 'payables_strategy':
                analysisType = "Financial Liquidity (Payments & Cash Flow)";
                specificGoal = "Analyze upcoming supplier obligations. Compare outstanding debt vs. the performance of the stock bought from that supplier. Suggest which supplier to pay first to maintain crucial sourcing relationships.";
                const { rows: payablesData } = await db.query(`
                    SELECT 
                        sup.name as supplier_name,
                        SUM(p.total_price - p.paid_amount) as total_debt,
                        COUNT(p.id) as pending_purchases,
                        EXTRACT(DAY FROM (NOW() - MIN(p.purchase_date))) as oldest_debt_days
                    FROM purchases p
                    JOIN suppliers sup ON p.supplier_id = sup.id
                    WHERE p.user_id = $1 AND p.payment_status != 'Paid'
                    GROUP BY sup.name
                    HAVING SUM(p.total_price - p.paid_amount) > 0
                    ORDER BY total_debt DESC
                    LIMIT 3
                `, [userId]);
                contextDataObj = { supplier_payables_overview: payablesData };
                break;

            default:
                return res.status(400).json({ error: "Invalid insight type requested." });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.3,
            }
        });

        const prompt = `
                You are a high-level strategic advisor for a gemstone trading business.
                The CEO has requested intelligence for the "${type.replace('_', ' ').toUpperCase()}" decision card.

                Your goal: ${specificGoal}

                Database Context:
                ${JSON.stringify(contextDataObj, null, 2)}

                INSTRUCTIONS:
                1. Review the data provided. 
                2. If the Database Context is empty or contains "no data", DO NOT say "there is no data". 
                   Instead, explain why this category is strategically important for a gem trader and provide a "decision" on what specific stock the CEO should acquire or what strategy to prepare to enter this market segment.
                3. IMPORTANT: All currency values and prices MUST be expressed in LKR (Sri Lankan Rupees). Use the prefix "LKR " instead of "$" (e.g., LKR 50,000). The database values provided are also in LKR.
                4. Generate exactly these components, keeping the TOTAL word count under 150 words:
                   - "insight_summary": A one-sentence high-level summary.
                   - "ai_explanation": A concise explanation (max 2 sentences) of the logic/trend.
                   - "key_findings": An array of exactly 3 specific, data-driven bullet points using the provided context.
                   - "decision": A single, powerful actionable business move.
                   - "expected_impact": A one-sentence projection of the business result (e.g., % liquidity or LKR gain).
                5. Use professional, direct language. Be specific with carats, cuts, colors, and LKR values.
                6. Output MUST be a valid JSON object. No preamble, no markdown.
                Format:
                {
                    "insight_summary": "...",
                    "ai_explanation": "...",
                    "key_findings": ["...", "...", "..."],
                    "decision": "...",
                    "expected_impact": "..."
                }
                `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        // Clean and parse JSON
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        let parsedInsight;
        try {
            parsedInsight = JSON.parse(responseText);
        } catch (e) {
            // Fallback for non-JSON response
            const parts = responseText.split(/Decision:/i);
            parsedInsight = {
                insight: parts[0]?.replace(/AI Insight:/i, '').trim() || responseText,
                decision: parts[1]?.trim() || "Consult your inventory logs for immediate action."
            };
        }

        // Final Sanitization: Ensure no stray "$" symbols remain in the output
        const sanitize = (text) => typeof text === 'string' ? text.replace(/\$/g, "LKR ") : text;
        
        parsedInsight.insight_summary = sanitize(parsedInsight.insight_summary);
        parsedInsight.ai_explanation = sanitize(parsedInsight.ai_explanation);
        if (Array.isArray(parsedInsight.key_findings)) {
            parsedInsight.key_findings = parsedInsight.key_findings.map(sanitize);
        }
        parsedInsight.decision = sanitize(parsedInsight.decision);
        parsedInsight.expected_impact = sanitize(parsedInsight.expected_impact);

        // Save logging specific ID
        try {
            await db.query(
                `INSERT INTO ai_insights (user_id, type, content) VALUES ($1, $2, $3)`,
                [userId, type, JSON.stringify(parsedInsight)]
            );
        } catch (dbErr) {
            console.warn("Could not save to ai_insights table:", dbErr.message);
        }

        res.json({ answer: parsedInsight });

    } catch (err) {
        console.error("AI_INSIGHT_ERROR:", err);
        
        // Handle Quota Exceeded (429) specifically
        if (err.status === 429) {
            return res.status(429).json({ 
                error: "QUOTA_EXCEEDED",
                message: "You have exceeded the daily AI request limit (Free Tier). Please wait a few hours or upgrade your Google AI plan.",
                retryAfter: 3600 // Suggesting 1 hour
            });
        }

        res.status(500).json({ error: "Intelligence engine failure. Please check logs." });
    }
};
