(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__148v_u1._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/apps/web/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
;
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 100;
const ipRequests = new Map();
const KILL_SWITCHES = {
    "/api/ai": [
        "ai-copilot"
    ],
    "/api/webhooks": [
        "webhooks"
    ],
    "/api/public": [
        "api-public"
    ]
};
function getFlagForPath(pathname) {
    for (const [prefix, flags] of Object.entries(KILL_SWITCHES)){
        if (pathname.startsWith(prefix)) return flags[0];
    }
    return null;
}
async function verifyPortalToken(token) {
    try {
        const { jwtVerify } = await Promise.resolve().then(()=>__turbopack_context__.i("[project]/node_modules/jose/dist/webapi/index.js [middleware-edge] (ecmascript)"));
        const secret = new TextEncoder().encode(process.env.PORTAL_JWT_SECRET || "cos-due-diligence-portal-secret-2026");
        const { payload } = await jwtVerify(token, secret);
        return !!payload.sub;
    } catch  {
        return false;
    }
}
async function middleware(request) {
    const response = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    const { pathname } = request.nextUrl;
    // Portal auth protection
    if (pathname.startsWith("/portal") && !pathname.startsWith("/portal/login")) {
        const token = request.cookies.get("portal_token")?.value;
        if (!token || !await verifyPortalToken(token)) {
            const loginUrl = new URL("/portal/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
        }
    }
    // CORS
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const record = ipRequests.get(ip);
    if (record && now < record.reset) {
        record.count++;
        if (record.count > RATE_LIMIT_MAX) {
            response.headers.set("Retry-After", `${Math.ceil((record.reset - now) / 1000)}`);
            return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"](JSON.stringify({
                error: "Too many requests"
            }), {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": `${Math.ceil((record.reset - now) / 1000)}`
                }
            });
        }
    } else {
        ipRequests.set(ip, {
            count: 1,
            reset: now + RATE_LIMIT_WINDOW
        });
    }
    // Kill switch check via header (set by feature flag service)
    const flag = getFlagForPath(pathname);
    if (flag && request.headers.get("x-kill-switch") === flag) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"](JSON.stringify({
            error: "This feature is disabled",
            code: "FEATURE_DISABLED"
        }), {
            status: 503,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
    return response;
}
const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__148v_u1._.js.map