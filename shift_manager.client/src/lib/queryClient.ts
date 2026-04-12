import { QueryClient } from "@tanstack/react-query";
import {
    getOfficers, getBeats, getShifts,
    getEmergencyReports, getDashboardStats,
    fetchAPI, clearAuth
} from "./api";

const ROUTE_MAP: Record<string, () => Promise<unknown>> = {
    "/api/officers": getOfficers,
    "/api/beats": getBeats,
    "/api/shifts": getShifts,
    "/api/emergency-reports": getEmergencyReports,
    "/api/dashboard/stats": getDashboardStats,
};

export async function apiRequest(method: string, url: string, data?: unknown) {
    const res = await fetchAPI(url, {
        method,
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
    }
    return res;
}

const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const key = queryKey[0] as string;
    if (ROUTE_MAP[key]) return ROUTE_MAP[key]();

    const res = await fetchAPI(key);
    
    // fetchAPI actually handles 401 redirect internally inside api.ts, 
    // rendering explicit 401 handling here mostly redundant, but good as a final safety net.
    if (res.status === 401) {
        clearAuth();
        window.location.href = "/login";
        return null;
    }
    if (!res.ok) throw new Error(`${res.status}: ${(await res.text()) || res.statusText}`);
    return res.json();
};

const ALL_KEYS = [
    "/api/officers",
    "/api/beats",
    "/api/shifts",
    "/api/emergency-reports",
    "/api/dashboard/stats",
] as const;

export function invalidateAll() {
    return Promise.all(
        ALL_KEYS.map(key => queryClient.invalidateQueries({ queryKey: [key] }))
    );
}

export function invalidateOfficerRelated() {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/officers"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/emergency-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }),
    ]);
}

export function invalidateShiftRelated() {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }),
    ]);
}

export function invalidateReportRelated() {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/emergency-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }),
    ]);
}
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: defaultQueryFn,
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 2,
            retry: 1,
        },
        mutations: { retry: false },
    },
});